import { Schema, model, Document } from 'mongoose';

export interface IPprocedures extends Document {
  patientId: string;
  uuid: string;
  procedureId: string;
  procedureName: string;
  status: string;
  notes: string;
  createdAt: string;
  visitId: string;
  clinic?: Schema.Types.ObjectId;
  description?: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
  sync_status: boolean
}

const patientProceduresSchema = new Schema<IPprocedures>({
  patientId: String,
  description: String,
  clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  procedureId: String,
  procedureName: String,
  status: String,
  notes: String,
  visitId: String,
  uuid: { type: String, unique: true },
  sync_status: { type: Boolean, default: false },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IPprocedures>('patientProcedures', patientProceduresSchema);

