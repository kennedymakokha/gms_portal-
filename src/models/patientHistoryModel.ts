import { Schema, model, Document } from 'mongoose';

export interface IPHistory extends Document {
  patientId: string;
  uuid: string;
  clinic?: Schema.Types.ObjectId;
  description: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
  sync_status: boolean
}

const patientHistorySchema = new Schema<IPHistory>({
  patientId: String,
  description: String,
  clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  uuid: { type: String, unique: true },
  sync_status: { type: Boolean, default: false },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IPHistory>('patientHistory', patientHistorySchema);

