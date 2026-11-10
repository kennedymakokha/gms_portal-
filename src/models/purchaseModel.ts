
import { Schema, model, Document, Types } from "mongoose";

export type PurchaseStatus = "Pending" | "Received";

export interface IPurchase extends Document {
  orderNumber: string;
  supplier: string;
  medicine: Types.ObjectId;
  medicineName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: PurchaseStatus;
  receivedAt?: Date | null;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Received"],
      default: "Pending",
      index: true,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default model<IPurchase>("Purchase", PurchaseSchema);
