import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
 pharmacy?: Schema.Types.ObjectId;
  uuid: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  // pharmacy:  { type: Schema.Types.ObjectId, ref: 'pharmacy' },
  created_by:  { type: Schema.Types.ObjectId, ref: 'tb_user' },
  uuid: { type: String, unique: true },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<ICategory>('Category', CategorySchema);

