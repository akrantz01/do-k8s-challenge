import { Provider as KubernetesProvider } from '@pulumi/kubernetes';
import { Config } from '@pulumi/pulumi';

import { Ambassador } from './ambassador';
import { Cluster } from './cluster';
import { Linkerd } from './linkerd';
import { ArgoCD } from './argocd';
import { Tekton } from './tekton';
import { Host, Mapping } from './crds/getambassador/v3alpha1';

// Pull the configuration values
const config = new Config();
const baseDomain = config.require('acme.domain');
const cloudConnectToken = config.getSecret('cloudConnectToken');
const email = config.require('acme.email');
const nodeType = config.get('nodeType') || 's-2vcpu-4gb';
const region = config.require('region');

// Create the cluster with its configuration
const cluster = new Cluster('cluster', { nodeType, region });

// Create a Kubernetes provider that uses our cluster from above
const clusterProvider = new KubernetesProvider('cluster', {
  kubeconfig: cluster.kubeconfig,
});
const kubernetesOpts = {
  provider: clusterProvider,
  dependsOn: [clusterProvider],
};

// Deploy Linkerd 2 service mesh
const linkerd = new Linkerd('linkerd', { version: '2.11.1' }, kubernetesOpts);

// Deploy Ambassador
const ambassador = new Ambassador(
  'ambassador',
  { version: '2.1.0', linkerd: true, cloudConnectToken },
  { ...kubernetesOpts, dependsOn: linkerd.ready },
);

// Expose the Linkerd dashboard
new Host(
  'linkerd-viz-host',
  {
    metadata: {
      name: 'linkerd-viz-host',
      namespace: 'linkerd-viz',
    },
    spec: {
      hostname: `linkerd.${baseDomain}`,
      mappingSelector: {
        matchLabels: {
          host: 'linkerd-viz',
        },
      },
      requestPolicy: {
        insecure: {
          action: 'Redirect',
        },
      },
      acmeProvider: {
        email,
      },
    },
  },
  { ...kubernetesOpts, dependsOn: [ambassador] },
);
new Mapping(
  'linkerd-viz-mapping',
  {
    metadata: {
      name: 'linkerd-viz-mapping',
      namespace: 'linkerd-viz',
      labels: {
        host: 'linkerd-viz',
      },
    },
    spec: {
      host: `linkerd.${baseDomain}`,
      prefix: '/',
      service: 'web.linkerd-viz.svc.cluster.local:8084',
      host_rewrite: 'web.linkerd-viz.svc.cluster.local:8084',
    },
  },
  { ...kubernetesOpts, dependsOn: [ambassador] },
);

// Install ArgoCD onto the cluster
new ArgoCD(
  'argo-cd',
  { domain: `argo.${baseDomain}`, email },
  {
    ...kubernetesOpts,
    dependsOn: [ambassador],
  },
);

// Install Tekton onto the cluster
new Tekton(
  'tekton',
  { domain: `tekton.${baseDomain}`, email },
  { ...kubernetesOpts, dependsOn: [ambassador] },
);
