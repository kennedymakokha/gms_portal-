import { Schema, model, Document } from 'mongoose';

export interface IPatientMedications extends Document {
  patientId: string;
  uuid: string;
  drugId: string;
  dosage: string;
  drugName: string;
  visitId: string;  
  clinic?: Schema.Types.ObjectId;
  description?: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
  sync_status: boolean
}

const patientMedicationsSchema = new Schema<IPatientMedications>({
  patientId: String,
  description: String,
  clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  drugId: String,
  dosage: String,
  drugName: String,
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

export default model<IPatientMedications>('patientMedications', patientMedicationsSchema);

