import { Schema, model, Document } from 'mongoose';


export interface patientLabRecord extends Document {
    uuid: string;
    visitId: Schema.Types.ObjectId;
    patientId: Schema.Types.ObjectId;
    created_by: Schema.Types.ObjectId;
    clinic: Schema.Types.ObjectId;
    testId: Schema.Types.ObjectId;
    results: String;
    notes: String;
    orderedBy: Schema.Types.ObjectId;
    orderedAt: string;
    labtechId: Schema.Types.ObjectId;
    Order_ID: string;
    status: "pending" | "in-progress" | "completed" | "cancelled";
    priority: "routine" | "urgent" | "stat";
    completedAt?: string;

}



const patientslabSchema = new Schema<patientLabRecord>({

    uuid: { type: String, unique: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'visits' },
    patientId: { type: Schema.Types.ObjectId, ref: 'patient' },
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },
    orderedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    labtechId: { type: Schema.Types.ObjectId, ref: 'User' },
    testId: { type: Schema.Types.ObjectId, ref: 'lab' },
    clinic: { type: Schema.Types.ObjectId, ref: 'clinic' },
    results: { type: String },
    Order_ID: { type: String },
    notes: { type: String },
    priority: { type: String, default: "routine" },
    status: { type: String, default: "pending" },
    completedAt: { type: Date, default: null },



}, { timestamps: true });

export default model<patientLabRecord>('patientslab', patientslabSchema);

