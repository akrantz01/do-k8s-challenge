import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { Release } from '@pulumi/kubernetes/helm/v3';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';

/**
 * Arguments to Ambassador concerting which version is deployed
 */
export interface InstallArgs {
  /**
   * The namespace to install into
   */
  namespace: string;
  /**
   * The Ambassador version to deploy
   */
  version: string;
}

/**
 * Deploy the Ambassador API gateway onto a Kubernetes cluster
 */
export class Ambassador extends ComponentResource {
  readonly crds: ConfigFile;
  readonly service: Release;

  /**
   * Deploy the Ambassador API gateway onto a cluster
   * @param name The __unique__ name of the resource
   * @param args The arguments to configure the cluster
   * @param opts A bag of options that control this resource's behavior
   */
  constructor(name: string, args: InstallArgs, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super(
      'akrantz01:do-k8s-challenge:kubernetes:Ambassador',
      name,
      inputs,
      opts,
    );

    const { namespace, version } = args;

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Install the Ambassador custom resource definitions
    this.crds = new ConfigFile(
      'ambassador-crds',
      {
        file: `https://app.getambassador.io/yaml/edge-stack/${version}/aes-crds.yaml`,
      },
      defaultResourceOptions,
    );

    // Deploy Ambassador
    this.service = new Release(
      'ambassador',
      {
        namespace: namespace,
        createNamespace: true,
        name: 'edge-stack',
        chart: 'edge-stack',
        repositoryOpts: {
          repo: 'https://app.getambassador.io',
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.crds] },
    );
  }
}
