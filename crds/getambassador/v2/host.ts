// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import { input as inputs, output as outputs } from "../../types";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * Host is the Schema for the hosts API
 */
export class Host extends pulumi.CustomResource {
    /**
     * Get an existing Host resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Host {
        return new Host(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:getambassador.io/v2:Host';

    /**
     * Returns true if the given object is an instance of Host.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Host {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Host.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"getambassador.io/v2" | undefined>;
    public readonly kind!: pulumi.Output<"Host" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * HostSpec defines the desired state of Host
     */
    public readonly spec!: pulumi.Output<{[key: string]: any} | undefined>;
    /**
     * HostStatus defines the observed state of Host
     */
    public readonly status!: pulumi.Output<outputs.getambassador.v2.HostStatus | undefined>;

    /**
     * Create a Host resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: HostArgs, opts?: pulumi.CustomResourceOptions) {
        let inputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            inputs["apiVersion"] = "getambassador.io/v2";
            inputs["kind"] = "Host";
            inputs["metadata"] = args ? args.metadata : undefined;
            inputs["spec"] = args ? args.spec : undefined;
            inputs["status"] = args ? args.status : undefined;
        } else {
            inputs["apiVersion"] = undefined /*out*/;
            inputs["kind"] = undefined /*out*/;
            inputs["metadata"] = undefined /*out*/;
            inputs["spec"] = undefined /*out*/;
            inputs["status"] = undefined /*out*/;
        }
        if (!opts.version) {
            opts = pulumi.mergeOptions(opts, { version: utilities.getVersion()});
        }
        super(Host.__pulumiType, name, inputs, opts);
    }
}

/**
 * The set of arguments for constructing a Host resource.
 */
export interface HostArgs {
    readonly apiVersion?: pulumi.Input<"getambassador.io/v2">;
    readonly kind?: pulumi.Input<"Host">;
    readonly metadata?: pulumi.Input<ObjectMeta>;
    /**
     * HostSpec defines the desired state of Host
     */
    readonly spec?: pulumi.Input<{[key: string]: any}>;
    /**
     * HostStatus defines the observed state of Host
     */
    readonly status?: pulumi.Input<inputs.getambassador.v2.HostStatusArgs>;
}
