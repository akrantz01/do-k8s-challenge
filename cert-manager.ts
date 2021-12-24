import { Namespace, Secret } from '@pulumi/kubernetes/core/v1';
import { Release } from '@pulumi/kubernetes/helm/v3';
import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, Output, ResourceOptions } from '@pulumi/pulumi';
import { ClusterIssuer } from './crds/certmanager/v1';

/**
 * Arguments to define how cert-manager is installed
 */
export interface Args {
  /**
   * The cert-manager version to install
   */
  version: string;
  /**
   * The email to use for certificate expiry notifications
   */
  email: string;
  /**
   * Cloudflare API key for DNS verification
   */
  cloudflareToken: Output<string>;
}

/**
 * Deploys cert-manager onto the cluster
 */
export class CertManager extends ComponentResource {
  readonly crds: ConfigFile;
  readonly namespace: Namespace;
  readonly release: Release;
  readonly secret: Secret;
  readonly issuer: ClusterIssuer;

  /**
   * Deploy cert-manager onto a cluster
   * @param name The __unique__ name of the resource
   * @param args The arguments to configure the installation
   * @param opts A bag of options that control this resource's behavior
   */
  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super(
      'akrantz01:do-k8s-challenge:kubernetes:CertManager',
      name,
      inputs,
      opts,
    );

    const { version, email, cloudflareToken } = args;

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Add the custom resource definitions
    this.crds = new ConfigFile(
      `${name}-crds`,
      {
        file: `https://github.com/jetstack/cert-manager/releases/download/${version}/cert-manager.crds.yaml`,
      },
      defaultResourceOptions,
    );

    // Create a namespace for the deployment
    this.namespace = new Namespace(
      `${name}-ns`,
      {
        metadata: {
          name: 'cert-manager',
        },
      },
      defaultResourceOptions,
    );
    const namespaceName = this.namespace.metadata.apply((m) => m.name);

    // Deploy the helm chart
    this.release = new Release(
      name,
      {
        chart: 'cert-manager',
        version,
        namespace: namespaceName,
        repositoryOpts: {
          repo: 'https://charts.jetstack.io',
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.crds] },
    );

    // Create a secret for the Cloudflare API key
    this.secret = new Secret(
      `${name}-cloudflare-api-token`,
      {
        type: 'Opaque',
        stringData: {
          apiKey: cloudflareToken,
        },
        metadata: {
          name: `${name}-cloudflare-api-token`,
          namespace: namespaceName,
        },
      },
      defaultResourceOptions,
    );

    // Install the cluster issuer
    this.issuer = new ClusterIssuer(
      `${name}-issuer`,
      {
        metadata: {
          name: `${name}-issuer`,
        },
        spec: {
          acme: {
            email,
            server: 'https://acme-v02.api.letsencrypt.org/directory',
            privateKeySecretRef: {
              name: `${name}-issuer-secret`,
            },
            solvers: [
              {
                selector: {},
                dns01: {
                  cloudflare: {
                    email,
                    apiTokenSecretRef: {
                      name: this.secret.metadata.apply((m) => m.name),
                      key: 'apiKey',
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        ...defaultResourceOptions,
        dependsOn: [this.crds, this.release, this.secret],
      },
    );
  }
}
