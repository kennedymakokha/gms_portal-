
import { Types } from "mongoose";
import { Schema, model, Document } from "mongoose";

export interface IMedicine extends Document {
    name: string;
    category: Types.ObjectId;
    manufacturer: string;
    batch: string;
    expiry: Date;
    price: number;
    quantity: number;
    reorder: number;
    isDeleted: boolean;
    deletedAt?: Date | null;
}

const MedicineSchema = new Schema<IMedicine>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        manufacturer: {
            type: String,
            trim: true,
            default: "",
        },
        batch: {
            type: String,
            required: true,
            trim: true,
        },
        expiry: {
            type: Date,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        reorder: {
            type: Number,
            min: 0,
            default: 10,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
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

// Prevent duplicate batch numbers for the same medicine name.
MedicineSchema.index(
    { name: 1, batch: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

export default model<IMedicine>("Medicine", MedicineSchema);
