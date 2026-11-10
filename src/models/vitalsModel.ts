import mongoose, { Schema, model } from 'mongoose';

// TypeScript interface for Visit document


export interface IVitals {
  uuid: string;          // unique identifier for the visit
  bp: string;            // blood pressure
  temperature: string;   // temperature
  vitalsNotes: string;
  pulse: string;         // pulse rate
  respiratoryRate: string; // respiratory rate
  weight: string;        // weight of the patient
  height: string;        // height of the patient
  bmi: string;           // body mass index of the patient
  oxygenSaturation?: string
  nurseId: Schema.Types.ObjectId;
  visitId: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt?: Date;      // automatically added by timestamps
  updatedAt?: Date;      // automatically added by timestamps

}



// Mongoose schema
const visitSchema = new Schema<IVitals>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    respiratoryRate: {
      type: String,
      default: '',
    },
    nurseId: { type: Schema.Types.ObjectId, ref: 'tb_user' },
    visitId: { type: Schema.Types.ObjectId, ref: 'tb_visits' },
    oxygenSaturation: {
      type: String,
    },
    bp: {
      type: String,
      default: '',
    },
    vitalsNotes: {
      type: String,
      default: '',
    },
    temperature: {
      type: String,
      default: '',
    },
    pulse: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Model
const Visits =
  mongoose.models.Visits ||
  mongoose.model<IVitals>("tb_vitals", visitSchema);

export default Visits;