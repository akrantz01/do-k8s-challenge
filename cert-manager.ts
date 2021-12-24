import { Namespace } from '@pulumi/kubernetes/core/v1';
import { Release } from '@pulumi/kubernetes/helm/v3';
import { ConfigFile } from '@pulumi/kubernetes/yaml';
import {
  ComponentResource,
  CustomResource,
  Output,
  ResourceOptions,
} from '@pulumi/pulumi';

/**
 * Arguments to define how cert-manager is installed
 */
export interface Args {
  /**
   * The cert-manager version to install
   */
  version: string;
}

/**
 * Deploys cert-manager onto the cluster
 */
export class CertManager extends ComponentResource {
  readonly crds: ConfigFile;
  readonly namespace: Namespace;
  readonly release: Release;

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

    const { version } = args;

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

    // Deploy the helm chart
    this.release = new Release(
      name,
      {
        chart: 'cert-manager',
        version,
        namespace: this.namespace.metadata.apply((m) => m.name),
        repositoryOpts: {
          repo: 'https://charts.jetstack.io',
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.crds] },
    );
  }
}
