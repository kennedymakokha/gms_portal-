import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Inventory from '../models/inventoryModel';
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildInventoryFilter } from './filters/inventoryFilters';


export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildInventoryFilter({
      clinicId: req.user?.clinicId, // optional if inventory is clinic-specific
      search,
    });

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Inventory.countDocuments(filter),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
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