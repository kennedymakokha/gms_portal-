import { Schema, model, Document } from 'mongoose';

export interface IWard extends Document {

  uuid: string;
  clinic: string;
  wardName: string;
  gender: 'male' | 'female' | 'other' ;
  type: 'general' | 'icu' | 'private' | 'semi-private';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}


const WardSchema = new Schema<IWard>({
  wardName: { type: String },
  gender: { type: String, default: "female" },
  type:{type:String,default:'general'},
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

export default model<IWard>('Wards', WardSchema);

