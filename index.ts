import { Provider as KubernetesProvider } from '@pulumi/kubernetes';
import { Config } from '@pulumi/pulumi';

import { Ambassador } from './ambassador';
import { CertManager } from './cert-manager';
import { Cluster } from './cluster';
import { Certificate } from './crds/certmanager/v1';
import { Linkerd } from './linkerd';

// Pull the configuration values
const config = new Config();
const cloudflareToken = config.requireSecret('acme.cloudflare.token');
const baseDomain = config.require('baseDomain');
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
  { version: '2.1.0', linkerd: true },
  { ...kubernetesOpts, dependsOn: linkerd.ready },
);

// Deploy cert-manager for TLS
const certManager = new CertManager(
  'cert-manager',
  { version: 'v1.6.1', email, cloudflareToken },
  kubernetesOpts,
);

// Create a certificate for all the base applications
new Certificate(
  'ambassador-certificate',
  {
    metadata: {
      name: 'ambassador-certificate',
      namespace: 'ambassador',
    },
    spec: {
      secretName: 'ambassador-certificate',
      issuerRef: {
        name: certManager.issuerName,
        kind: 'ClusterIssuer',
      },
      dnsNames: ['argo'].map((sub) => `${sub}.${baseDomain}`),
    },
  },
  { ...kubernetesOpts, dependsOn: [ambassador, certManager] },
);
