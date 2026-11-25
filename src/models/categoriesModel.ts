
import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  pharmacy: Types.ObjectId;
  uuid: string;
  created_by?: Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
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
    uuid: {
      type: String,
      required: true,
      unique: true,
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

CategorySchema.index(
  { pharmacy: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export default model<ICategory>("Category", CategorySchema);
