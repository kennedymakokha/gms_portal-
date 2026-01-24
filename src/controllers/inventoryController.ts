import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Inventory from '../models/inventoryModel';

export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const items = await Inventory.find({ deletedAt: null });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};