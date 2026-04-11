
import mongoose, { Schema, Document, Types } from "mongoose";


export interface Medication {
    _id: string;
    id?: string;
    uuid?: string;
    name: string;
    genericName?: string;
    category: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'inhaler' | 'other';
    dosageForm: string;
    strength: string;
    manufacturer?: string;
    batchNumber?: string;
    expiryDate: string;
    quantityInStock: number;
    reorderLevel: number;
    clinic: string;
    unitPrice: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
    createdAt?: string;
    deletedAt?: Date | null;
    isDeleted: boolean
    updatedAt?: string;
    created_by?: Schema.Types.ObjectId;
}
const MedicationSchema = new Schema<Medication>({
    _id: { type: String },
    id: { type: String },
    uuid: { type: String },
    name: { type: String },
    genericName: { type: String },
    dosageForm: { type: String },
    strength: { type: String },
    manufacturer: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: String },
    quantityInStock: { type: Number },
    clinic: { type: String },
    reorderLevel: { type: Number },
    unitPrice: { type: Number },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['in-stock', 'low-stock', 'out-of-stock', 'expired'], default: 'in-stock' },
    createdAt: { type: String },
    updatedAt: { type: String },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: { type: Date, default: null },
    category: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'], default: "tablet" },
});
MedicationSchema.index({ sender: 1, receiver: 1, timestamp: 1 });
const MedicationModel = mongoose.model<Medication>("Medication_tb", MedicationSchema);

export default MedicationModel;