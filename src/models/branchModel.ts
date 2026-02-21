import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchName: { type: String, required: true, unique: true },
  phone: { type: String, },
  uuid: { type: String, unique: true },
  inpatient: { type: Boolean, default: false },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  clinic: { type: Schema.Types.ObjectId, ref: 'clinic' },
  departments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
  head: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });


export default model('branch', branchSchema);
