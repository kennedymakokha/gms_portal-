import { Schema, model, Document } from 'mongoose';

export interface IPatientMedications extends Document {
  uuid: string;
  medicationId: Schema.Types.ObjectId;
  dosage: string;
  unitPrice: number;
  total: number;
  frequency: string;
  visitId: Schema.Types.ObjectId;
  quantity: number;
  clinic?: Schema.Types.ObjectId;
  instructions?: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
  sync_status: boolean
}

const patientMedicationsSchema = new Schema<IPatientMedications>({
  uuid: { type: String, unique: true },
  medicationId:  { type: Schema.Types.ObjectId, ref: 'tb_drugs' },
  instructions: String,
  clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },
  created_by: { type: Schema.Types.ObjectId, ref: 'tb_user' },
  dosage: String,
  unitPrice: Number,
  total: Number,
  frequency:Number,
  visitId: { type: Schema.Types.ObjectId, ref: 'tb_visits' },
  quantity:Number,

  sync_status: { type: Boolean, default: false },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IPatientMedications>('tb_patient_medications', patientMedicationsSchema);

