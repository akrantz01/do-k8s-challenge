import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';
import { Host, Mapping } from './crds/getambassador/v3alpha1';

/**
 * Arguments for deploying Tekton
 */
export interface Args {
  /**
   * The domain to route traffic to
   */
  domain: string;
  /**
   * The email for ACME certificate generation
   */
  email: string;
}

/**
 * Install Tekton CD to the cluster
 */
export class Tekton extends ComponentResource {
  readonly core: ConfigFile;
  readonly triggers: ConfigFile;
  readonly interceptors: ConfigFile;
  readonly dashboard: ConfigFile;

  readonly host: Host;
  readonly mapping: Mapping;

  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:Tekton', name, inputs, opts);

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    const { domain, email } = args;

    // Install the core components
    this.core = new ConfigFile(
      `${name}-core`,
      {
        file: 'https://storage.googleapis.com/tekton-releases/pipeline/previous/v0.30.0/release.yaml',
        transformations: [
          // Configure the artifact storage volume
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj: any) => {
            if (
              obj.kind === 'ConfigMap' &&
              obj.metadata &&
              obj.metadata.name === 'config-artifact-pvc'
            ) {
              if (!obj.data) obj.data = {};
              obj.data.size = '10Gi';
              obj.data.storageClassName = 'do-block-storage';
            }
          },
          // Inject linkerd into the namespace
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj: any) => {
            if (
              obj.kind === 'Namespace' &&
              obj.metadata &&
              obj.metadata.name === 'tekton-pipelines'
            ) {
              if (!obj.metadata.annotations) obj.metadata.annotations = {};
              obj.metadata.annotations['linkerd.io/inject'] = 'enabled';
            }
          },
        ],
      },
      defaultResourceOptions,
    );

    // Install Tekton Triggers and the interceptors
    this.triggers = new ConfigFile(
      `${name}-triggers`,
      {
        file: 'https://storage.googleapis.com/tekton-releases/triggers/previous/v0.17.1/release.yaml',
      },
      { ...defaultResourceOptions, dependsOn: this.core.ready },
    );
    this.interceptors = new ConfigFile(
      `${name}-interceptors`,
      {
        file: 'https://storage.googleapis.com/tekton-releases/triggers/previous/v0.17.1/interceptors.yaml',
      },
      { ...defaultResourceOptions, dependsOn: this.triggers.ready },
    );

    // Install the Tekton dashboard
    this.dashboard = new ConfigFile(
      `${name}-dashboard`,
      {
        file: 'https://github.com/tektoncd/dashboard/releases/download/v0.23.0/tekton-dashboard-release.yaml',
      },
      { ...defaultResourceOptions, dependsOn: this.interceptors.ready },
    );

    // Register the domain with Ambassador
    this.host = new Host(
      `${name}-host`,
      {
        metadata: {
          name: `${name}-host`,
          namespace: 'tekton-pipelines',
        },
        spec: {
          hostname: domain,
          mappingSelector: {
            matchLabels: {
              host: name,
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
      defaultResourceOptions,
    );

    // Enable routing to Tekton Dashboard
    this.mapping = new Mapping(
      `${name}-mapping`,
      {
        metadata: {
          name: `${name}-mapping`,
          namespace: 'tekton-pipelines',
          labels: {
            host: name,
          },
        },
        spec: {
          host: domain,
          prefix: '/',
          service: 'http://tekton-dashboard.tekton-pipelines',
          rewrite: '',
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.host, this.dashboard] },
    );
  }
}
