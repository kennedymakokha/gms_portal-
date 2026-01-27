import { Schema, model, Document } from 'mongoose';

export interface IProcedure extends Document {
  procedureName: string;
  description?: string;
  cost: string;
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
  uuid: { type: String, unique: true },
  cost: { type: String },
  description: { type: String },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IProcedure>('procedure', ProcedureScema);

