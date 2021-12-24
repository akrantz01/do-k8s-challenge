import { ComponentResource, Output, ResourceOptions } from '@pulumi/pulumi';
import {
  CertRequest,
  LocallySignedCert,
  PrivateKey,
  SelfSignedCert,
} from '@pulumi/tls';

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

  readonly expiration: Output<string>;

  constructor(name: string, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:Linkerd', name, inputs, opts);

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

    this.expiration = this.intermediateCertificate.validityEndTime;
  }
}
