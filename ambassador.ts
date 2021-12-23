import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';

/**
 * Arguments to Ambassador concerting which version is deployed
 */
export interface Args {
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
  readonly service: ConfigFile;

  /**
   * Deploy the Ambassador API gateway onto a cluster
   * @param name The __unique__ name of the resource
   * @param args The arguments to configure the cluster
   * @param opts A bag of options that control this resource's behavior
   */
  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super(
      'akrantz01:do-k8s-challenge:kubernetes:Ambassador',
      name,
      inputs,
      opts,
    );

    const { version } = args;

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Install the Ambassador custom resource definitions
    this.crds = new ConfigFile(
      'ambassador-crds',
      {
        file: `https://app.getambassador.io/yaml/edge-stack/${version}/aes-crds.yaml`,
      },
      { ...defaultResourceOptions },
    );

    // Deploy Ambassador
    this.service = new ConfigFile(
      'ambassador',
      {
        file: `https://app.getambassador.io/yaml/edge-stack/${version}/aes.yaml`,
      },
      { ...defaultResourceOptions, dependsOn: [this.crds] },
    );
  }
}
