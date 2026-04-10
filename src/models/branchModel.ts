import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchName: { type: String, required: true, unique: true },
  uuid: { type: String, unique: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  postalCode: { type: String, default: "100200" },
  address: { type: String, default: "P.O. Box 123 Kiminini" },
  phone_number:{type:String,default:"+2547354896"},
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
