import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  vin: string;
  client?: Schema.Types.ObjectId;
  status: 'PENDING_APPROVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  clientJobId: string;
  description: string;
  services: any[];   // <-- proper type
  userId?: string;
  assignedTo?: Schema.Types.ObjectId;
  created_by?: Schema.Types.ObjectId;
  cost: number;
  department?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  updatedAt: Date;
  clientUpdatedAt?: Date;
}

const JobSchema = new Schema<IJob>({
  vin: { type: String, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Customer' },
  status: { type: String, default: 'PENDING_APPROVAL' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  description: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  cost: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null },
  clientJobId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },

  //  FIXED: Use empty array shorthand
  services: [],

  clientUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model<IJob>('Job', JobSchema);
