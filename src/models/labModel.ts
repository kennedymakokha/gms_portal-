import { Schema, model, Document } from 'mongoose';

export interface ILab extends Document {
  testName: string;
  description?: string;
  uuid: string;
  clinic: Schema.Types.ObjectId;
  price: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const LabSchema = new Schema<ILab>({
  testName: { type: String, required: true, unique: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  clinic: { type: Schema.Types.ObjectId, ref: 'clinic' },
  uuid: { type: String, unique: true },
  description: { type: String },
  price: { type: String },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<ILab>('labs', LabSchema);

