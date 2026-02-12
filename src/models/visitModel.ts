import mongoose, { Schema, model } from 'mongoose';

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
  track: 'registered' | 'reg_billing' | 'lab_billing' | 'med_billing' | 'ward_billing' | 'triage' | 'pre-lab' | 'post-lab' | 'lab' | 'pharmecy' | 'admitted';
  bp: string;            // blood pressure
  totalAmount: number;
  consultationFee: number;  // total amount billed for the visit
  temperature: string;   // temperature
  pulse: string;         // pulse rate
  respiratoryRate: string; // respiratory rate
  // triage category
  weight: string;        // weight of the patient
  height: string;        // height of the patient
  bmi: string;           // body mass index of the patient
  created_by: Schema.Types.ObjectId;

  vitalsNurseId: Schema.Types.ObjectId;
  assignedDoctor?: Schema.Types.ObjectId;
  visitDate: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;      // automatically added by timestamps
  updatedAt?: Date;      // automatically added by timestamps
  chiefComplaint: string;
  symptoms: string[];
  totallabTestFee: number;
  prescribedTests: string[];
  testResults?: Record<string, string>;
  prescribedProcedures: string[];
  medications?: string[];
  oxygenSaturation?: string

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
  
    vitalsNurseId: { type: Schema.Types.ObjectId, ref: 'User' },

    track: { type: String, default: 'registered' },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    totalAmount: {
      type: Number,

      default: 0,
    },
    oxygenSaturation: {
      type: String,
    },
    totallabTestFee: {
      type: Number,

      default: 0,
    },
    consultationFee: {
      type: Number,

      default: 0,
    },
    patientId: {
      type: String,

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
    chiefComplaint: {
      type: String,
      default: '',
    },
    symptoms: [
      {
        type: String,
        default: '',
      }
    ],
    prescribedTests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'labs',
      },
    ],

    // testResults?: Record<string, string>;
    prescribedProcedures: [
      {
        type: Schema.Types.ObjectId,
        ref: 'procedure',
      },
    ],
    medications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'procedure',
      },
    ],
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
const Visits =
  mongoose.models.Visits ||
  mongoose.model<IVisits>("Visits", visitSchema);

export default Visits;