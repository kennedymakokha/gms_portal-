import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Pharmacys from '../models/PharmacyModel';


import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildPharmacyFilter } from './filters/pharmacyFilter';
import MedicationModel from '../models/medicationModal';


export const getPharmacys = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

 

    const [Pharmacys, total] = await Promise.all([
      MedicationModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      MedicationModel.countDocuments(filter),
    ]);

    res.status(200).json({
      data: Pharmacys,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching Pharmacys:', error);
    res.status(500).json({ message: error.message });
  }
};



export const createPharmacy = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid,
          name,
          phone_number,
          email,
          address,
          } = req.body;
    const exists = await Pharmacys.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          phone_number,
          email,
          address,
          clinic: req.user?.clinicId,
          isDeleted: req.body.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_by: req.user?.id,
          created_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    res.status(201).json(exists);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

// controllers/PharmacyController.js

export const updatePharmacy = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const dept = await Pharmacys.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!dept) return res.status(404).json({ error: 'Pharmacy not found' });
    res.json({ message: ' Pharmacy updated', dept });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeletePharmacy = async (req: AuthRequest, res: Response) => {
  try {


    const { id } = req.params; // or uuid — whichever you chose


    const pharm = await Pharmacys.findOneAndDelete({ uuid: id });

    if (!pharm) {
      console.log(' No Pharmacy found for uuid:', id);
      return res.status(404).json({ error: 'Pharmacy not found' });
    }

    console.log(' Deleted:', pharm.uuid);
    res.json({ message: ' Pharmacy deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deletePharmacy = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const pharm = await Pharmacys.findOneAndUpdate(
      { uuid: id, isDeleted: false }, // only active Pharmacys
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!pharm) {
      return res.status(404).json({
        error: 'Pharmacy not found or already deleted',
      });
    }

    res.json({
      message: ' Pharmacy soft-deleted',
      Pharmacy: pharm,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
