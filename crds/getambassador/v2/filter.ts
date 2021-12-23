// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

export class Filter extends pulumi.CustomResource {
    /**
     * Get an existing Filter resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Filter {
        return new Filter(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:getambassador.io/v2:Filter';

    /**
     * Returns true if the given object is an instance of Filter.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Filter {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Filter.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"getambassador.io/v2" | undefined>;
    public readonly kind!: pulumi.Output<"Filter" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    public readonly spec!: pulumi.Output<{[key: string]: any} | undefined>;

    /**
     * Create a Filter resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: FilterArgs, opts?: pulumi.CustomResourceOptions) {
        let inputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            inputs["apiVersion"] = "getambassador.io/v2";
            inputs["kind"] = "Filter";
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
        super(Filter.__pulumiType, name, inputs, opts);
    }
}

/**
 * The set of arguments for constructing a Filter resource.
 */
export interface FilterArgs {
    readonly apiVersion?: pulumi.Input<"getambassador.io/v2">;
    readonly kind?: pulumi.Input<"Filter">;
    readonly metadata?: pulumi.Input<ObjectMeta>;
    readonly spec?: pulumi.Input<{[key: string]: any}>;
}
