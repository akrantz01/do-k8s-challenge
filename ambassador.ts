import { ConfigMap } from '@pulumi/kubernetes/core/v1';
import { ConfigFile } from '@pulumi/kubernetes/yaml';
import { ComponentResource, Output, ResourceOptions } from '@pulumi/pulumi';

import { Listener } from './crds/getambassador/v3alpha1';

/**
 * Arguments to Ambassador concerting which version is deployed
 */
export interface Args {
  /**
   * The Ambassador version to deploy
   */
  version: string;
  /**
   * Whether to inject Linkerd 2
   */
  linkerd: boolean;
  /**
   * The token to connect to Ambassador Cloud
   */
  cloudConnectToken?: string | Output<string>;
}

/**
 * Deploy the Ambassador API gateway onto a Kubernetes cluster
 */
export class Ambassador extends ComponentResource {
  readonly crds: ConfigFile;
  readonly service: ConfigFile;
  readonly listenerHttp: Listener;
  readonly listenerHttps: Listener;

  /**
   * Deploy the Ambassador API gateway onto a cluster
   * @param name The __unique__ name of the resource
   * @param args The arguments to configure the cluster
   * @param opts A bag of options that control this resource's behavior
   */
  constructor(name: string, args: Args, opts?: ResourceOptions) {
    const inputs = { options: opts };
    super(
      'akrantz01:do-k8s-challenge:kubernetes:Ambassador',
      name,
      inputs,
      opts,
    );

    const { version, linkerd, cloudConnectToken } = args;

    // Automatically connect created resources with this module
    const defaultResourceOptions: ResourceOptions = { parent: this };

    // Install the Ambassador custom resource definitions
    this.crds = new ConfigFile(
      'ambassador-crds',
      {
        file: `https://app.getambassador.io/yaml/edge-stack/${version}/aes-crds.yaml`,
      },
      { ...defaultResourceOptions },
    );

    // Deploy Ambassador
    this.service = new ConfigFile(
      'ambassador',
      {
        file: `https://app.getambassador.io/yaml/edge-stack/${version}/aes.yaml`,
        transformations: [
          // Optionally inject linkerd support based on https://www.getambassador.io/docs/edge-stack/latest/howtos/linkerd2/
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj: any) => {
            if (linkerd) {
              if (
                obj.kind === 'Deployment' &&
                obj.metadata &&
                obj.metadata.namespace === 'ambassador'
              ) {
                if (!obj.spec.template.metadata.annotations)
                  obj.spec.template.metadata.annotations = {};
                obj.spec.template.metadata.annotations['linkerd.io/inject'] =
                  'enabled';

                // Special handling for edge-stack and edge-stack-redis deployments
                if (obj.metadata.name === 'edge-stack') {
                  obj.spec.template.metadata.annotations[
                    'config.linkerd.io/skip-inbound-ports'
                  ] = '80,443';
                } else if (obj.metadata.name === 'edge-stack-redis') {
                  obj.spec.template.metadata.annotations[
                    'config.linkerd.io/opaque-ports'
                  ] = '6379';
                }
              }
            }
          },
        ],
      },
      { ...defaultResourceOptions, dependsOn: [this.crds] },
    );

    if (cloudConnectToken) {
      new ConfigMap(
        `${name}-cloud-token`,
        {
          metadata: {
            name: 'edge-stack-agent-cloud-token',
            namespace: 'ambassador',
          },
          data: {
            CLOUD_CONNECT_TOKEN: cloudConnectToken,
          },
        },
        { ...defaultResourceOptions, dependsOn: [this.service] },
      );
    }

    // Create HTTP/S listeners
    this.listenerHttp = new Listener(
      `${name}-http-8080`,
      {
        metadata: {
          name: `${name}-http-8080`,
          namespace: 'ambassador',
        },
        spec: {
          port: 8080,
          protocol: 'HTTP',
          securityModel: 'XFP',
          hostBinding: {
            namespace: {
              from: 'ALL',
            },
          },
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.service] },
    );
    this.listenerHttps = new Listener(
      `${name}-http-8443`,
      {
        metadata: {
          name: `${name}-http-8443`,
          namespace: 'ambassador',
        },
        spec: {
          port: 8443,
          protocol: 'HTTPS',
          securityModel: 'XFP',
          hostBinding: {
            namespace: {
              from: 'ALL',
            },
          },
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.service] },
    );
  }
}
