import { Schema, model, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  head: Schema.Types.ObjectId,
  uuid: string;
  fee: number
  clinic?: string;
  patients?: Types.ObjectId[];
  staffs?: Types.ObjectId[];
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
  clinic: { type: String },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  head: { type: Schema.Types.ObjectId, ref: 'User' },
  uuid: { type: String, unique: true },
  patients: [{ type: Schema.Types.ObjectId, ref: "Patient" }],
  staffs: [{ type: Schema.Types.ObjectId, ref: "Users" }],
  description: { type: String },
  fee: { type: Number, default: 500 },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IDepartment>('Department', DepartmentSchema);

