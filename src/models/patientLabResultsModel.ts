import { Schema, model, Document } from 'mongoose';


export interface IPlabResults extends Document {
  patientId: string;
  uuid: string;
  visitId: string;
  testId: string;
  testName: string;
  result: string;
  createdAt: string;
  clinic?: Schema.Types.ObjectId;
  description?: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
  sync_status: boolean
}

const patientMedicationsSchema = new Schema<IPlabResults>({
  patientId: String,
  description: String,
  clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  testId: String,
  testName: String,
  result: String,
  createdAt: String,
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

export default model<IPlabResults>('patientLabResults', patientMedicationsSchema);

