import mongoose, { Schema, model } from 'mongoose';

// TypeScript interface for Visit document


export interface IVisits {
  uuid: string;          // unique identifier for the visit
  patientId: string;   // reference to the patient (as string)
  patientMongoose: Schema.Types.ObjectId;   // reference to the patient (as string)
  branch: Schema.Types.ObjectId;        // reference to the branch (as string)
  disposition: string;   // disposition of the visit
  diagnosis: string;     // diagnosis of the visit
  labOrders: string;     // lab orders for the visit
  pharmacyInstructions: string; // pharmacy instructions for the visit
  track: 'registered' | 'reg_billing' | 'lab_billing' | 'med_billing' | 'ward_billing' | 'triage' | 'pre-lab' | 'post-lab' | 'lab' | 'pharmacy' | 'admitted';
  totalAmount: number;
  consultationFee: number;  // total amount billed for the visit
  created_by: Schema.Types.ObjectId;
  assignedDoctor?: Schema.Types.ObjectId;
  visitDate: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;      // automatically added by timestamps
  updatedAt?: Date;      // automatically added by timestamps
  chiefComplaint: string;
  symptoms: string[];
  totallabTestFee: number;
  prescribedTests: Schema.Types.ObjectId[];
  testResults?: Record<string, string>;
  prescribedProcedures: string[];
  medications?: string[];
 

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
   
    patientMongoose: { type: Schema.Types.ObjectId, ref: 'Patient' },
    created_by:  { type: Schema.Types.ObjectId, ref: 'tb_user' },
  
    
    track: { type: String, default: 'registered' },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'tb_user',
      index: true,
    },
    totalAmount: {
      type: Number,

      default: 0,
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
    
    visitDate: {
      type: Date,
      default: null,
    },
    branch: { type: Schema.Types.ObjectId, ref: 'branch' },
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
        ref: 'patientslab',
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
  
  },
  { timestamps: true }
);

// Model
const Visits =
  mongoose.models.Visits ||
  mongoose.model<IVisits>("tb_visits", visitSchema);

export default Visits;