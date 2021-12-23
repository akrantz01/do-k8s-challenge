import { Config } from '@pulumi/pulumi';
import { Cluster } from './cluster';

// Pull the configuration values
const config = new Config();
const nodeType = config.get('nodeType') || 's-2vcpu-4gb';
const region = config.require('region');

// Create the cluster with its configuration
const cluster = new Cluster('cluster', { nodeType, region });
const kubeconfig = cluster.k8s.kubeConfigs.apply(
  (configs) => configs[0].rawConfig,
);
