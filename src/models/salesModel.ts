
import { Schema, model, Document, Types } from "mongoose";

export type PaymentMethod = "cash" | "mpesa" | "card";

export interface ISaleItem {
    medicine: Types.ObjectId;
    medicineName: string;
    batch: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface ISale extends Document {
    reference: string;
    items: ISaleItem[];
    customerName: string;
    customer?: Types.ObjectId | null;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    amountPaid: number;
    change: number;
    status: "completed";
}

const SaleItemSchema = new Schema<ISaleItem>(
    {
        medicine: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
        },
        medicineName: { type: String, required: true },
        batch: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const SaleSchema = new Schema<ISale>(
    {
        reference: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        items: {
            type: [SaleItemSchema],
            required: true,
            validate: {
                validator: (items: ISaleItem[]) => items.length > 0,
                message: "A sale must contain at least one item.",
            },
        },
        customerName: { type: String, trim: true, default: "Walk-in Customer" },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "mpesa", "card"],
            required: true,
        },
        totalAmount: { type: Number, required: true, min: 0 },
        amountPaid: { type: Number, required: true, min: 0 },
        change: { type: Number, required: true, min: 0, default: 0 },
        status: {
            type: String,
            enum: ["completed"],
            default: "completed",
        },
    },
    { timestamps: true }
);

export default model<ISale>("Sale", SaleSchema);
