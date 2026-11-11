import mongoose, { Document, Schema, Types } from "mongoose";

export type PrescriptionStatus = "Pending" | "Verified";

export interface IPrescription extends Document {
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
    reference: {
      type: String,
      required: true,
      unique: true,
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

prescriptionSchema.index({ createdAt: -1 });
prescriptionSchema.index({ patient: 1 });

const Prescription = mongoose.model<IPrescription>(
  "Prescription",
  prescriptionSchema
);

export default Prescription;