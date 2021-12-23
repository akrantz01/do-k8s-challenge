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

export interface Args {
  region: string;
  nodeType: string;
}

export class Cluster extends ComponentResource {
  readonly vpc: Vpc;
  readonly k8s: KubernetesCluster;
  readonly kubeconfig: Output<string>;

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
