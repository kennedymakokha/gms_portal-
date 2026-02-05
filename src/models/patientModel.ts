import { Schema, model, Types } from 'mongoose';

export interface IPatient {
  uuid: string;
  name: string;
  dob: string;
  sex: 'Male' | 'Female' | 'Other';

  phone?: string;
  nationalId?: string;

  nokName?: string;
  nokRelationship?: string;
  nokPhone?: string;
  status?: "outpatient" | "admitted" | "critical" | "discharged";
  bloodgroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  room?: string;
  history?: string;
  assignedDoctor?: Types.ObjectId;
  created_by?: Types.ObjectId;
  clinic?: Types.ObjectId;
  address?: string,
  admissionDate: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const PatientSchema = new Schema<IPatient>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    bloodgroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O-', 'O+'],
    },
    room: {
      type: String,

    },
    admissionDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["outpatient", "admitted", "critical", "discharged"],
      required: true,
      default: 'outpatient'
    },
    dob: {
      type: String,
      required: true,
    },

    sex: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },

    phone: { type: String },
    nationalId: { type: String },
    nokName: { type: String },
    nokRelationship: { type: String },
    nokPhone: { type: String },
    history: { type: String },
    address: { type: String },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    clinic: {
      type: Schema.Types.ObjectId,
      ref: 'clinic',
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

PatientSchema.index({
  name: 'text',
  phone: 'text',
});
export default model<IPatient>('Patient', PatientSchema);