import { Schema, model, Document } from 'mongoose';
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true }
});


export default model('Customer', customerSchema);
