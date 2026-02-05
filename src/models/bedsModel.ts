import { Schema, model, Document } from 'mongoose';

export interface IBed extends Document {

  uuid: string;
  clinic: string;
  bedNumber: string;
  ward: string;
  type: 'general' | 'icu' | 'private' | 'semi-private';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}


const BedSchema = new Schema<IBed>({
  bedNumber: { type: String },
  ward: { type: String },
  type: { type: String, default: "general" },
  status: { type: String, default: "available" },
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

export default model<IBed>('Beds', BedSchema);

