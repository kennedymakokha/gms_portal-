import { Schema, model, Document, Types } from 'mongoose';

export interface IPhermacy extends Document {
  name: string;
  phone_number?: string;
 email?: string;
 address?:string
  uuid: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const PhermacySchema = new Schema<IPhermacy>({
  name: { type: String, required: true, unique: true },
  phone_number: { type: String, required: true, unique: true },
   email: { type: String, required: true, unique: true },
    address: { type: String, required: true, unique: true },
  created_by:  { type: Schema.Types.ObjectId, ref: 'tb_user' },
  uuid: { type: String, unique: true },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IPhermacy>('pharmacy', PhermacySchema);

