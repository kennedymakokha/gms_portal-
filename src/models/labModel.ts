import { Schema, model, Document, Types } from 'mongoose';

export interface ILab {
  testName: string;
  description?: string;
  category: 'blood' | 'urine' | 'imaging' | 'pathology' | 'other';
  uuid: string;
  branch: Types.ObjectId;
  created_by?: Types.ObjectId;
  price: string;
  turnaroundTime: string;
  requiresFasting: boolean;
  status: 'active' | 'inactive';

  deletedAt?: Date | null;
  isDeleted: boolean
}

const LabSchema = new Schema<ILab>(
  {
    testName: { type: String, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    branch: { type: Schema.Types.ObjectId, ref: 'branch' },
    uuid: { type: String, required: true },
    description: { type: String },
    price: { type: String },
    category: { type: String },
    turnaroundTime: { type: String },
    requiresFasting: { type: Boolean, default: false },
    status: { type: String, default: "active" },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

LabSchema.index({ uuid: 1, branch: 1 }, { unique: true });
LabSchema.index({ testName: 1, branch: 1 }, { unique: true });
export const Labs = model<ILab>('labs', LabSchema);


