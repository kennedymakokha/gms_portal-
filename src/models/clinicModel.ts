import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true,  unique: true },
  phone: { type: String, },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
});


export default model('clinic', customerSchema);
