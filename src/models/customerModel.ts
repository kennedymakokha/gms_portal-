
import { Schema, model, Document, Types } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    visits: number;
    pharmacy: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        address: {
            type: String,
            trim: true,
            default: "",
        },

        visits: {
            type: Number,
            default: 0,
            min: 0,
        },

        pharmacy: {
            type: Schema.Types.ObjectId,
            ref: "Pharmacy",
            required: true,
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

// Phone numbers must be unique within each pharmacy.
// Deleted customers do not block phone number reuse.
CustomerSchema.index(
    { pharmacy: 1, phone: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isDeleted: false,
        },
    }
);

// Optimize pharmacy customer listing and sorting.
CustomerSchema.index({
    pharmacy: 1,
    isDeleted: 1,
    name: 1,
});

export default model<ICustomer>("Customer", CustomerSchema);
