// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import { input as inputs, output as outputs } from "../../types";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * Mapping is the Schema for the mappings API
 */
export class Mapping extends pulumi.CustomResource {
    /**
     * Get an existing Mapping resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Mapping {
        return new Mapping(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:getambassador.io/v2:Mapping';

    /**
     * Returns true if the given object is an instance of Mapping.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Mapping {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Mapping.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"getambassador.io/v2" | undefined>;
    public readonly kind!: pulumi.Output<"Mapping" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * MappingSpec defines the desired state of Mapping
     */
    public readonly spec!: pulumi.Output<{[key: string]: any} | undefined>;
    /**
     * MappingStatus defines the observed state of Mapping
     */
    public readonly status!: pulumi.Output<outputs.getambassador.v2.MappingStatus | undefined>;

    /**
     * Create a Mapping resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: MappingArgs, opts?: pulumi.CustomResourceOptions) {
        let inputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            inputs["apiVersion"] = "getambassador.io/v2";
            inputs["kind"] = "Mapping";
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
        super(Mapping.__pulumiType, name, inputs, opts);
    }
}

/**
 * The set of arguments for constructing a Mapping resource.
 */
export interface MappingArgs {
    readonly apiVersion?: pulumi.Input<"getambassador.io/v2">;
    readonly kind?: pulumi.Input<"Mapping">;
    readonly metadata?: pulumi.Input<ObjectMeta>;
    /**
     * MappingSpec defines the desired state of Mapping
     */
    readonly spec?: pulumi.Input<{[key: string]: any}>;
    /**
     * MappingStatus defines the observed state of Mapping
     */
    readonly status?: pulumi.Input<inputs.getambassador.v2.MappingStatusArgs>;
}
