import { Schema, model, Document } from 'mongoose';
// name TEXT,
//             price REAL,
//              uuid TEXT,
//             clinic TEXT,
//             isDeleted TEXT,
//             stock INTEGER DEFAULT 0,
//             updatedAt TEXT,
//             sync_status INTEGER DEFAULT 0
export interface IDrug extends Document {
  name: string;
  price?: string;
  uuid: string;
  clinic: Schema.Types.ObjectId;
  stock: number;
  created_by?: Schema.Types.ObjectId;
  deletedAt?: Date | null;
  isDeleted: boolean
}


const DrugSchema = new Schema<IDrug>({
  name: { type: String, required: true, unique: true },
  price: { type: String },
  clinic: { type: Schema.Types.ObjectId, ref: 'clinic' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  uuid: { type: String, unique: true },
  stock: { type: Number },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IDrug>('drugs', DrugSchema);

