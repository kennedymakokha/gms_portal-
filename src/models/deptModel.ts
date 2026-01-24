import { Schema, model, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  uuid: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  uuid: { type: String, unique: true },
  description: { type: String },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IDepartment>('Department', DepartmentSchema);

