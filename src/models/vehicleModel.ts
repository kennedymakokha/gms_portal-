import { Schema, model, Document } from 'mongoose';

export interface IVehicle extends Document {
  vin: string;
  make: string;
  car_model: string;
  created_by?: Schema.Types.ObjectId;
  owner_id?: Schema.Types.ObjectId;
  year: number;
  deletedAt?: Date | null;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  vin: { type: String, required: true },
  make: { type: String, required: true },
  car_model: { type: String, required: true },
  year: { type: Number, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  owner_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IVehicle>('vehicle', VehicleSchema);