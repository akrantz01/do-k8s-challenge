import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';

/**
 * Install Tekton CD to the cluster
 */
export class Tekton extends ComponentResource {
  readonly core: ConfigFile;

  constructor(name: string, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:Tekton', name, inputs, opts);

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Install the core components
    this.core = new ConfigFile(
      `${name}-core`,
      {
        file: 'https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml',
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
  }
}
