import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  phone: { type: String, },
  uuid: { type: String, unique: true },

  created_by:  { type: Schema.Types.ObjectId, ref: 'tb_user' },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  branches: [{ type: Schema.Types.ObjectId, ref: "branch" }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });


export default model('clinic', customerSchema);
