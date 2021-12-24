import { Provider as KubernetesProvider } from '@pulumi/kubernetes';
import { Config } from '@pulumi/pulumi';

import { Ambassador } from './ambassador';
import { Cluster } from './cluster';
import { Linkerd } from './linkerd';
import { Namespace, Service } from '@pulumi/kubernetes/core/v1';
import { Deployment } from '@pulumi/kubernetes/apps/v1';
import { Mapping } from './crds/getambassador/v3alpha1';

// Pull the configuration values
const config = new Config();
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

// Test injection was successful
const namespace = new Namespace(
  'testing-namespace',
  {
    metadata: {
      name: 'qotm',
      annotations: {
        'linkerd.io/inject': 'enabled',
      },
    },
  },
  { ...kubernetesOpts, dependsOn: [ambassador] },
);

const namespaceName = namespace.metadata.apply((m) => m.name);
const deployment = new Deployment(
  'testing-deployment',
  {
    metadata: {
      name: 'qotm',
      namespace: namespaceName,
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'qotm',
        },
      },
      template: {
        metadata: {
          labels: {
            app: 'qotm',
          },
        },
        spec: {
          containers: [
            {
              name: 'qotm',
              image: 'docker.io/datawire/qotm:1.7',
              ports: [
                {
                  name: 'http-api',
                  containerPort: 5000,
                },
              ],
              env: [
                {
                  name: 'POD_IP',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'status.podIP',
                    },
                  },
                },
              ],
              readinessProbe: {
                httpGet: {
                  path: '/health',
                  port: 5000,
                },
                initialDelaySeconds: 60,
                periodSeconds: 3,
              },
              resources: {
                limits: {
                  cpu: '0.1',
                  memory: '100Mi',
                },
              },
            },
          ],
        },
      },
    },
  },
  { ...kubernetesOpts, dependsOn: [namespace] },
);

const service = new Service(
  'testing-service',
  {
    metadata: {
      name: 'qotm-linkerd2',
      namespace: namespaceName,
    },
    spec: {
      ports: [
        {
          name: 'http',
          port: 80,
          targetPort: 5000,
        },
      ],
      selector: {
        app: 'qotm',
      },
    },
  },
  { ...kubernetesOpts, dependsOn: [deployment] },
);

new Mapping(
  'testing-mapping',
  {
    metadata: {
      name: 'linkerd2-qotm',
      namespace: namespaceName,
    },
    spec: {
      hostname: '*',
      prefix: '/qotm-linkerd2/',
      service: 'qotm-linkerd2',
    },
  },
  { ...kubernetesOpts, dependsOn: [service] },
);
