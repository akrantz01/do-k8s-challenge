import { Chart } from '@pulumi/kubernetes/helm/v3';
import {
  ComponentResource,
  CustomResource,
  Output,
  ResourceOptions,
} from '@pulumi/pulumi';
import {
  CertRequest,
  LocallySignedCert,
  PrivateKey,
  SelfSignedCert,
} from '@pulumi/tls';

/**
 * Arguments to Linkerd concerning which version is deployed
 */
interface Args {
  /**
   * The Linkerd 2 version to deploy
   */
  version: string;
}

/**
 * Deploy Linkerd using a Helm chart
 */
export class Linkerd extends ComponentResource {
  // Generated mTLS root CAs and private keys
  private caPrivateKey: PrivateKey;
  private caCertificate: SelfSignedCert;
  private intermediatePrivateKey: PrivateKey;
  private intermediateCSR: CertRequest;
  private intermediateCertificate: LocallySignedCert;

  // Helm chart deployment for Linkerd itself and the Viz plugin
  readonly linkerd: Chart;
  readonly viz: Chart;

  // Export whether the install has complete
  readonly ready: Output<CustomResource[]>;

  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:Linkerd', name, inputs, opts);

    const { version } = args;

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Generate the mTLS root certificates following:
    // https://linkerd.io/2.11/tasks/generate-certificates/
    this.caPrivateKey = new PrivateKey(
      'ca-private-key',
      {
        algorithm: 'ECDSA',
        ecdsaCurve: 'P256',
      },
      defaultResourceOptions,
    );
    this.caCertificate = new SelfSignedCert(
      'ca-certificate',
      {
        allowedUses: ['cert_signing', 'crl_signing'],
        keyAlgorithm: this.caPrivateKey.algorithm,
        privateKeyPem: this.caPrivateKey.privateKeyPem,
        subjects: [
          {
            commonName: 'root.linkerd.cluster.local',
          },
        ],
        validityPeriodHours: 87600,
        isCaCertificate: true,
      },
      defaultResourceOptions,
    );
    this.intermediatePrivateKey = new PrivateKey(
      'intermediate-private-key',
      {
        algorithm: 'ECDSA',
        ecdsaCurve: 'P256',
      },
      defaultResourceOptions,
    );
    this.intermediateCSR = new CertRequest(
      'intermediate-csr',
      {
        keyAlgorithm: this.intermediatePrivateKey.algorithm,
        privateKeyPem: this.intermediatePrivateKey.privateKeyPem,
        subjects: [
          {
            commonName: 'identity.linkerd.cluster.local',
          },
        ],
      },
      defaultResourceOptions,
    );
    this.intermediateCertificate = new LocallySignedCert(
      'intermediate-certificate',
      {
        allowedUses: ['cert_signing', 'crl_signing'],
        caCertPem: this.caCertificate.certPem,
        caKeyAlgorithm: this.caPrivateKey.algorithm,
        caPrivateKeyPem: this.caPrivateKey.privateKeyPem,
        certRequestPem: this.intermediateCSR.certRequestPem,
        validityPeriodHours: 8760,
        isCaCertificate: true,
      },
      defaultResourceOptions,
    );

    // Deploy with Helm
    const now = new Date();
    const expiration = new Date(now.getHours() + 8760);
    this.linkerd = new Chart(
      'linkerd2',
      {
        chart: 'linkerd2',
        version,
        fetchOpts: {
          repo: 'https://helm.linkerd.io/stable',
        },
        values: {
          identityTrustAnchorsPEM: this.caCertificate.certPem,
          identity: {
            issuer: {
              crtExpiry: expiration.toISOString(),
              tls: {
                crtPEM: this.intermediateCertificate.certPem,
                keyPEM: this.intermediatePrivateKey.privateKeyPem,
              },
            },
          },
        },
      },
      defaultResourceOptions,
    );

    // Deploy the viz plugin
    this.viz = new Chart(
      'linkerd-viz',
      {
        chart: 'linkerd-viz',
        version,
        fetchOpts: {
          repo: 'https://helm.linkerd.io/stable',
        },
      },
      { ...defaultResourceOptions, dependsOn: this.linkerd.ready },
    );
    this.ready = this.viz.ready;
  }
}
