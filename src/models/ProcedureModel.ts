import { Schema, model, Document } from 'mongoose';


// category: 'minor' | 'major' | 'diagnostic' | 'therapeutic';
//   description: string;
//   price: number;
//   duration: string;
//   requiresAnesthesia: boolean;
//   status: 'active' | 'inactive';
export interface IProcedure extends Document {
  procedureName: string;
  description?: string;
  category: 'minor' | 'major' | 'diagnostic' | 'therapeutic',
  requiresAnesthesia: boolean
  duration: string
  status: 'active' | 'inactive'
  price: string;
  uuid: string;
  clinic: string;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}

const ProcedureScema = new Schema<IProcedure>({
  procedureName: { type: String, required: true, unique: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  clinic: { type: String },
  category: { type: String },
  requiresAnesthesia: { type: Boolean },
  duration: { type: String },
  status: { type: String, default: 'active' },
  uuid: { type: String, unique: true },
  price: { type: String },
  description: { type: String },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IProcedure>('procedure', ProcedureScema);

