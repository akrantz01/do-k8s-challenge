import { Release } from '@pulumi/kubernetes/helm/v3';
import {
  ComponentResource,
  ResourceOptions,
  interpolate,
} from '@pulumi/pulumi';
import { Mapping } from './crds/getambassador/v3alpha1';
import { Service } from '@pulumi/kubernetes/core/v1';

/**
 * Arguments for deploying ArgoCD
 */
export interface Args {
  /**
   * The domain to route traffic to
   */
  domain: string;
}

/**
 * Deploy ArgoCD onto the cluster
 */
export class ArgoCD extends ComponentResource {
  readonly release: Release;
  readonly uiRoute: Mapping;
  readonly cliRoute: Mapping;

  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super('akrantz01:do-k8s-challenge:kubernetes:ArgoCD', name, inputs, opts);

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    const { domain } = args;

    // Install Argo-CD
    this.release = new Release(
      name,
      {
        chart: './argo-cd',
        namespace: 'argo-cd',
        createNamespace: true,
        dependencyUpdate: true,
      },
      defaultResourceOptions,
    );

    // Enable routing to Argo-CD
    const serviceName = interpolate`${this.release.name}-argocd-server.${this.release.namespace}:443`;
    this.uiRoute = new Mapping(
      `${name}-ui`,
      {
        metadata: {
          name: `${name}-ui`,
          namespace: 'argo-cd',
        },
        spec: {
          host: domain,
          prefix: '/',
          service: serviceName,
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.release] },
    );
    this.cliRoute = new Mapping(
      `${name}-cli`,
      {
        metadata: {
          name: `${name}-cli`,
          namespace: 'argo-cd',
        },
        spec: {
          host: `${domain}:443`,
          prefix: '/',
          service: serviceName,
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.release] },
    );
  }
}
