import { Schema, model, Document } from 'mongoose';

export interface IInventory extends Document {
  itemName: string;
  quantity: number;
  price: number;
  sku: string;
  deletedAt?: Date | null;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>({
  itemName: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  sku: { type: String, unique: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default model<IInventory>('Inventory', InventorySchema);