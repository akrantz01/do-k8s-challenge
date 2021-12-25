import { Release } from '@pulumi/kubernetes/helm/v3';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';

/**
 * Deploy ArgoCD onto the cluster
 */
export class ArgoCD extends ComponentResource {
  readonly release: Release;

  constructor(name: string, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:ArgoCD', name, inputs, opts);

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    this.release = new Release(
      name,
      {
        chart: './argo-cd',
        namespace: 'argo-cd',
        createNamespace: true,
      },
      defaultResourceOptions,
    );
  }
}
