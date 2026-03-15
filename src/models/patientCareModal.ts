import { Schema, model, Document } from 'mongoose';


interface CareTask {
    uuid: string;
    id: string;
    patientName: string;
    patientId: Schema.Types.ObjectId;
    created_by: Schema.Types.ObjectId;
    assignedTo?: Schema.Types.ObjectId;
    branch: Schema.Types.ObjectId;
    room?: string;
    task: string;
    type: 'medication' | 'vitals' | 'care' | 'assessment';
    priority: 'high' | 'medium' | 'low';
    dueTime: string;
    completed: boolean;
    completedAt: Date
}



const CareTaskSchema = new Schema<CareTask>({

    uuid: { type: String, unique: true },
    patientName: String,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    branch: { type: Schema.Types.ObjectId, ref: 'branch' },
    room: { type: String },
    task: { type: String },
    dueTime: { type: String },
    completed: { type: Boolean },
    priority: { type: String, default: "low" },

    completedAt: { type: Date, default: null },
}, { timestamps: true });

export default model<CareTask>('careTask', CareTaskSchema);

