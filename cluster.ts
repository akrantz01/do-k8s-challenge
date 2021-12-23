import {
  ComponentResource,
  Inputs,
  Output,
  ResourceOptions,
} from '@pulumi/pulumi';
import {
  KubernetesCluster,
  Vpc,
  getKubernetesVersions,
} from '@pulumi/digitalocean';

/**
 * Arguments to Cluster concerning how it is deployed
 */
export interface Args {
  /**
   * Where to deploy the cluster
   */
  region: string;
  /**
   * What type of nodes to use in the node pool
   */
  nodeType: string;
}

/**
 * A Kubernetes cluster with a VPC
 */
export class Cluster extends ComponentResource {
  // vpc is the VPC which the cluster will be attached to for all networking
  readonly vpc: Vpc;
  // k8s is the fully configured cluster that was created
  readonly k8s: KubernetesCluster;
  // kubeconfig is the configuration to connect to the cluster
  readonly kubeconfig: Output<string>;

  /**
   * Create a new cluster with a VPC
   * @param name The __unique__ name of the resource
   * @param args The arguments to configure the cluster
   * @param opts A bag of options that control this resource's behavior
   */
  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs: Inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:Cluster', name, inputs, opts);

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Create a new VPC for all the networking
    this.vpc = new Vpc(
      `${name}-vpc`,
      { region: args.region },
      defaultResourceOptions,
    );

    // Create the cluster with the default version
    const latestVersion = getKubernetesVersions(
      {},
      defaultResourceOptions,
    ).then((v) => v.latestVersion);
    this.k8s = new KubernetesCluster(
      `${name}-k8s`,
      {
        version: latestVersion,
        region: args.region,
        ha: false,
        autoUpgrade: true,
        vpcUuid: this.vpc.id,
        maintenancePolicy: {
          startTime: '00:00',
          day: 'sunday',
        },
        nodePool: {
          name: `${name}-node-pool`,
          size: args.nodeType,
          nodeCount: 3,
        },
      },
      defaultResourceOptions,
    );

    // Extract the kubeconfig
    this.kubeconfig = this.k8s.kubeConfigs.apply((k) => k[0].rawConfig);
  }
}
