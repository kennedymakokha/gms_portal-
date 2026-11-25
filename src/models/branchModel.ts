
import { Schema, model, Types } from "mongoose";

export interface IBranch {
  branchName: string;
  uuid: string;
  pharmacy: Types.ObjectId;
  created_by?: Types.ObjectId;
  postalCode?: string;
  address?: string;
  phone_number?: string;
  departments: Types.ObjectId[];
  head?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const BranchSchema = new Schema<IBranch>(
  {
    branchName: {
      type: String,
      required: true,
      trim: true,
    },

    uuid: {
      type: String,
      required: true,
      trim: true,
    },

    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "tb_user",
    },

    postalCode: {
      type: String,
      default: "100200",
    },

    address: {
      type: String,
      default: "P.O. Box 123 Kiminini",
    },

    phone_number: {
      type: String,
      default: "+2547354896",
    },

    departments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

    head: {
      type: Schema.Types.ObjectId,
      ref: "tb_user",
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
  { timestamps: true }
);

// Branch names only need to be unique within a pharmacy.
BranchSchema.index(
  { pharmacy: 1, branchName: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

BranchSchema.index(
  { pharmacy: 1, uuid: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export default model<IBranch>("branch", BranchSchema);
