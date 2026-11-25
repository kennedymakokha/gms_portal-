import { Schema, model, Document, Types } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description?: string;
  head?: Types.ObjectId;
  uuid?: string;
  fee: number;
  pharmacy: Types.ObjectId;
  branch?: Types.ObjectId;
  patients?: Types.ObjectId[];
  staffs?: Types.ObjectId[];
  created_by?: Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
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

    branch: {
      type: Schema.Types.ObjectId,
      ref: "branch",
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "tb_user",
    },

    head: {
      type: Schema.Types.ObjectId,
      ref: "tb_user",
    },

    uuid: {
      type: String,
      trim: true,
    },

    patients: [
      {
        type: Schema.Types.ObjectId,
        ref: "Patient",
      },
    ],

    staffs: [
      {
        type: Schema.Types.ObjectId,
        ref: "tb_user",
      },
    ],

    description: {
      type: String,
      trim: true,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
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

// Department names are unique within each pharmacy.
DepartmentSchema.index(
  { pharmacy: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      pharmacy: { $exists: true },
      isDeleted: false,
    },
  }
);

// UUIDs are unique within each pharmacy when provided.
DepartmentSchema.index(
  { pharmacy: 1, uuid: 1 },
  {
    unique: true,
    partialFilterExpression: {
      pharmacy: { $exists: true },
      uuid: { $type: "string" },
      isDeleted: false,
    },
  }
);

// Efficient pharmacy-scoped department listing.
DepartmentSchema.index({
  pharmacy: 1,
  isDeleted: 1,
  createdAt: -1,
});

export default model<IDepartment>("Department", DepartmentSchema);