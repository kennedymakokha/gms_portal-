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

  history?: string;

  created_by?: Types.ObjectId;
  clinic?: Types.ObjectId;

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

    dob: {
      type: String,
      required: true,
    },

    sex: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },

    phone: String,
    nationalId: String,

    nokName: String,
    nokRelationship: String,
    nokPhone: String,

    history: String,

    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
export default model<IPatient>('Patient', PatientSchema);