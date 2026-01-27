import { Schema, model, Types } from 'mongoose';

export interface IPatient {

  uuid: string; //  FIX: must be a string, not schema syntax
  age: string;
  phone?: string;
  name: string
  nokName?: string;
  nokRelationship?: string;
  nokPhone?: string;
  sex: 'Male' | 'Female' | 'Other';
  created_by?: Types.ObjectId;
  clinic?: Types.ObjectId;
  isDeleted: boolean;
  history?: string;
  nationalId?: string;
  dob: string;
  deletedAt?: Date | null;
  patientUpdatedAt?: Date;
}
// nokName TEXT, 
//             nokRelationship TEXT, 
//             nokPhone TEXT,
const PatientSchema = new Schema<IPatient>(

  {
  
    uuid: {
      type: String,
      unique: true,
      index: true,
    },
    age: {
      type: String,

    },
    name: {
      type: String,
      required: true,
    },

    nokName: {
      type: String
    },
    nokRelationship: {
      type: String
    },
    nokPhone: {
      type: String
    },
    phone: {
      type: String,
    },
    sex: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: 'clinic',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    history: {
      type: String,
    },
    nationalId: {
      type: String,
    },
    dob: {
      type: String,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
    patientUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Patient = model<IPatient>('patient', PatientSchema);
export default Patient;
