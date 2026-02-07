import { Schema, model, Document } from 'mongoose';

export interface ILab extends Document {
  testName: string;
  description?: string;
  category: 'blood' | 'urine' | 'imaging' | 'pathology' | 'other';
  uuid: string;
  clinic: string;
  price: string;
  turnaroundTime: string;
  requiresFasting: boolean;
  status: 'active' | 'inactive';
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const LabSchema = new Schema<ILab>({
  testName: { type: String, required: true, unique: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  clinic: { type: String },
  uuid: { type: String, unique: true },
  description: { type: String },
  price: { type: String },
  category: { type: String },
  turnaroundTime: { type: String },
  requiresFasting: { type: Boolean, default: false },
  status: { type: String ,default:"active"},
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<ILab>('labs', LabSchema);

