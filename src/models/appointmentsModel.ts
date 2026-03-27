import { Schema, model, Document } from 'mongoose';


export interface Appointment {
  uuid: string;
  patientId: Schema.Types.ObjectId;
 
  doctorId: Schema.Types.ObjectId;
  created_by: Schema.Types.ObjectId;
 
  date: Date;
  time: string;
  clinic: string;
  type: 'checkup' | 'followup' | 'emergency' | 'surgery';
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  notes?: string;
  deletedAt?: Date | null;
  isDeleted: boolean
}


const AppointmentSchema = new Schema<Appointment>({
  patientId:{ type: Schema.Types.ObjectId, ref: 'Patient' },

  date: { type: Date },
 
  doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
  time: { type: String },
  notes: { type: String },
  type: { type: String, default: "checkup" },
  status: { type: String, default: "scheduled" },
  clinic: { type: String },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  uuid: { type: String, unique: true },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<Appointment>('Appointments', AppointmentSchema);

