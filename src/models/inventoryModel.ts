
import { Schema, model, Document, Types } from "mongoose";

export interface IInventory extends Document {
    pharmacy: Types.ObjectId;
    itemName: string;
    quantity: number;
    price: number;
    sku: string;
    deletedAt?: Date | null;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
    {
        pharmacy: {
            type: Schema.Types.ObjectId,
            ref: "Pharmacy",
            required: true,
            index: true,
        },

        itemName: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        price: {
            type: Number,
            default: 0,
            min: 0,
        },

        sku: {
            type: String,
            required: true,
            trim: true,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// SKU only needs to be unique within a pharmacy.
// Deleted records do not prevent reuse of an SKU.
InventorySchema.index(
    { pharmacy: 1, sku: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isDeleted: false,
        },
    }
);

// Efficient pharmacy inventory queries.
InventorySchema.index({
    pharmacy: 1,
    isDeleted: 1,
    createdAt: -1,
});

export default model<IInventory>("Inventory", InventorySchema);
