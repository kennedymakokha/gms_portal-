import { Schema, model } from 'mongoose';

// TypeScript interface for Visit document
export interface IVisits {
  uuid: string;          // unique identifier for the visit
  patientuuid: string;   // reference to the patient (as string)
  notes: string;         // optional notes about the visit
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
    patientuuid: {
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
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Model
const Visits = model<IVisits>('Visits', visitSchema);
export default Visits;
