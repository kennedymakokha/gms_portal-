import { Schema, model, Document, Types } from "mongoose";

export interface IPharmacy extends Document {
  name: string;
  phone_number?: string;
  email?: string;
  address?: string;
  registration_number?: string;
  kra_pin?: string;
  logo?: string;

  currency: string;
  timezone: string;

  settings: {
    tax_enabled: boolean;
    tax_rate: number;
    low_stock_alerts: boolean;
    expiry_alerts: boolean;
    pending_order_alerts: boolean;
  };

  createdBy: Types.ObjectId;
  isActive: boolean;
}

const PharmacySchema = new Schema<IPharmacy>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    registration_number: {
      type: String,
      trim: true,
    },
    kra_pin: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    currency: {
      type: String,
      default: "KES",
    },
    timezone: {
      type: String,
      default: "Africa/Nairobi",
    },
    settings: {
      tax_enabled: {
        type: Boolean,
        default: false,
      },
      tax_rate: {
        type: Number,
        default: 0,
        min: 0,
      },
      low_stock_alerts: {
        type: Boolean,
        default: true,
      },
      expiry_alerts: {
        type: Boolean,
        default: true,
      },
      pending_order_alerts: {
        type: Boolean,
        default: true,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "tb_user",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model<IPharmacy>("Pharmacy", PharmacySchema);