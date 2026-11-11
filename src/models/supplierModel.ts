import mongoose, { Document, Schema } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const supplierSchema = new Schema<ISupplier>(
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
    contactPerson: {
      type: String,
      trim: true,
      default: "",
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
  { timestamps: true }
);

supplierSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

const Supplier = mongoose.model<ISupplier>("Supplier", supplierSchema);

export default Supplier;