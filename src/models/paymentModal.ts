import { Schema, model, Document } from 'mongoose';


export interface PaymentRecord extends Document {
    uuid: string;
    visitId: Schema.Types.ObjectId;
    patientId: Schema.Types.ObjectId;
    created_by: Schema.Types.ObjectId;
    clinic: Schema.Types.ObjectId;
    consultationFee: number;
    labFee: number;
    medFee: number;
    otherFee: number;
    boardingFee: number;
    consultationFeepaidAt: Date | null;
    labFeepaidAt: Date | null;
    otherFeepaidAt: Date | null;
    boardingFeepaidAt: Date | null;
    medFeepaidAt: Date | null;
    track: 'registered' | 'reg_billing' | 'lab' | 'lab_billing' | 'med_billing' | 'ward_billing' | 'triage' | 'pre-lab' | 'post-lab' | 'pharmecy' | 'admitted';
    method: "cash" | "card" | "insurance" | "mobile";
    status: "pending" | "paid" | "overdue" | "cancelled";

    invoiceId: string;
    patientName: string;
    amount: number;

    date: string;
    reference?: string;

}



const invoiceSchema = new Schema<PaymentRecord>({

    uuid: { type: String, unique: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visits' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    clinic: { type: Schema.Types.ObjectId, ref: 'clinic', index: true },
    consultationFee: { type: Number },
    labFee: { type: Number, default: 0 },
    medFee: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 },
    boardingFee: { type: Number, default: 0 },
    method: { type: String, default: 'mobile' },
    track: { type: String, default: 'reg_billing' },
    consultationFeepaidAt: { type: Date, default: null, index: true },
    labFeepaidAt: { type: Date, default: null, index: true },
    medFeepaidAt: { type: Date, default: null, index: true },
    otherFeepaidAt: { type: Date, default: null, index: true },
    boardingFeepaidAt: { type: Date, default: null, index: true },
    status: { type: String, default: 'pending' },


}, { timestamps: true });

export default model<PaymentRecord>('payments', invoiceSchema);

