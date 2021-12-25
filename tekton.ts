import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';

/**
 * Install Tekton CD to the cluster
 */
export class Tekton extends ComponentResource {
  readonly core: ConfigFile;
  readonly triggers: ConfigFile;
  readonly interceptors: ConfigFile;
  readonly dashboard: ConfigFile;

  constructor(name: string, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:Tekton', name, inputs, opts);

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Install the core components
    this.core = new ConfigFile(
      `${name}-core`,
      {
        file: 'https://storage.googleapis.com/tekton-releases/pipeline/previous/v0.30.0/release.yaml',
        transformations: [
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
        file: 'https://github.com/tektoncd/dashboard/releases/download/v0.23.0/openshift-tekton-dashboard-release.yaml',
      },
      { ...defaultResourceOptions, dependsOn: this.interceptors.ready },
    );
  }
}
