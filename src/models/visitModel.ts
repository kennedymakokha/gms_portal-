import { Schema, model } from 'mongoose';

// TypeScript interface for Visit document


export interface IVisits {
  uuid: string;          // unique identifier for the visit
  patientId: string;   // reference to the patient (as string)
  patientMongoose: Schema.Types.ObjectId;   // reference to the patient (as string)
  notes: string;         // optional notes about the visit
  clinic: string;        // reference to the clinic (as string)
  disposition: string;   // disposition of the visit
  diagnosis: string;     // diagnosis of the visit
  labOrders: string;     // lab orders for the visit
  pharmacyInstructions: string; // pharmacy instructions for the visit
  bp: string;            // blood pressure
  totalAmount: number;  // total amount billed for the visit
  temperature: string;   // temperature
  pulse: string;         // pulse rate
  respiratoryRate: string; // respiratory rate
  // triage category
  weight: string;        // weight of the patient
  height: string;        // height of the patient
  bmi: string;           // body mass index of the patient
  created_by: Schema.Types.ObjectId;
  visitDate: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;      // automatically added by timestamps
  updatedAt?: Date;      // automatically added by timestamps
}

// Mongoose schema
const visitSchema = new Schema<IVisits>(
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
    patientMongoose: { type: Schema.Types.ObjectId, ref: 'Patient' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    visitDate: {
      type: Date,
      default: null,
    },
    clinic: {
      type: String,
      required: true,
    },
    disposition: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
    },
    labOrders: {
      type: String,
      default: '',
    },
    pharmacyInstructions: {
      type: String,
      default: '',
    },
    bp: {
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
const Visits = model<IVisits>('Visits', visitSchema);
export default Visits;
