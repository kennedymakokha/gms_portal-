
import mongoose, { Document, Schema, Types } from "mongoose";

export type PrescriptionStatus = "Pending" | "Verified";

export interface IPrescription extends Document {
  pharmacy: Types.ObjectId;
  reference: string;
  patient: string;
  medicine: Types.ObjectId;
  medicineName: string;
  notes?: string;
  status: PrescriptionStatus;
  verifiedAt?: Date | null;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    patient: {
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
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Verified"],
      default: "Pending",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index(
  { pharmacy: 1, reference: 1 },
  { unique: true }
);

prescriptionSchema.index({ pharmacy: 1, patient: 1 });
prescriptionSchema.index({ pharmacy: 1, createdAt: -1 });

export default mongoose.model<IPrescription>(
  "Prescription",
  prescriptionSchema
);
