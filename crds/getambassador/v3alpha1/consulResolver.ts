// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import { input as inputs, output as outputs } from "../../types";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * ConsulResolver is the Schema for the ConsulResolver API
 */
export class ConsulResolver extends pulumi.CustomResource {
    /**
     * Get an existing ConsulResolver resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): ConsulResolver {
        return new ConsulResolver(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:getambassador.io/v3alpha1:ConsulResolver';

    /**
     * Returns true if the given object is an instance of ConsulResolver.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is ConsulResolver {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === ConsulResolver.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"getambassador.io/v3alpha1" | undefined>;
    public readonly kind!: pulumi.Output<"ConsulResolver" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * ConsulResolver tells Ambassador to use Consul to resolve services. In addition to the AmbassadorID, it needs information about which Consul server and DC to use.
     */
    public readonly spec!: pulumi.Output<outputs.getambassador.v3alpha1.ConsulResolverSpec | undefined>;

    /**
     * Create a ConsulResolver resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: ConsulResolverArgs, opts?: pulumi.CustomResourceOptions) {
        let inputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            inputs["apiVersion"] = "getambassador.io/v3alpha1";
            inputs["kind"] = "ConsulResolver";
            inputs["metadata"] = args ? args.metadata : undefined;
            inputs["spec"] = args ? args.spec : undefined;
        } else {
            inputs["apiVersion"] = undefined /*out*/;
            inputs["kind"] = undefined /*out*/;
            inputs["metadata"] = undefined /*out*/;
            inputs["spec"] = undefined /*out*/;
        }
        if (!opts.version) {
            opts = pulumi.mergeOptions(opts, { version: utilities.getVersion()});
        }
        super(ConsulResolver.__pulumiType, name, inputs, opts);
    }
}

/**
 * The set of arguments for constructing a ConsulResolver resource.
 */
export interface ConsulResolverArgs {
    readonly apiVersion?: pulumi.Input<"getambassador.io/v3alpha1">;
    readonly kind?: pulumi.Input<"ConsulResolver">;
    readonly metadata?: pulumi.Input<ObjectMeta>;
    /**
     * ConsulResolver tells Ambassador to use Consul to resolve services. In addition to the AmbassadorID, it needs information about which Consul server and DC to use.
     */
    readonly spec?: pulumi.Input<inputs.getambassador.v3alpha1.ConsulResolverSpecArgs>;
}