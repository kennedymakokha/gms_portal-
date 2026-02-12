import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Drugs from '../models/drugsModel';


import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildDrugFilter } from './filters/drugFilters';


export const getDrugs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildDrugFilter({
      clinicId: req.user?.clinicId,
      search,
    });

    const [drugs, total] = await Promise.all([
      Drugs.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Drugs.countDocuments(filter),
    ]);

    res.status(200).json({
      data: drugs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ message: error.message });
  }
};

// export const deleteAllDrugs = async (req: AuthRequest, res: Response) => {
//   try {
//     await Drugs.deleteMany({});
//     res.json({ message: 'All drugs deleted successfully' });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const createDrug = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid, name, price, stock } = req.body;
    const drug = await Drugs.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          price,
          stock,
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
    res.status(201).json(drug);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

// controllers/DrugController.js

export const updateDrug = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const dept = await Drugs.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!dept) return res.status(404).json({ error: 'Drug not found' });
    res.json({ message: ' Drug updated', dept });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeleteDrug = async (req: AuthRequest, res: Response) => {
  try {


    const { id } = req.params; // or uuid — whichever you chose


    const dept = await Drugs.findOneAndDelete({ uuid: id });

    if (!dept) {
      console.log(' No Drug found for uuid:', id);
      return res.status(404).json({ error: 'Drug not found' });
    }

    console.log(' Deleted:', dept.uuid);
    res.json({ message: ' Drug deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deleteDrug = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dept = await Drugs.findOneAndUpdate(
      { uuid: id, isDeleted: false }, // only active Drugs
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!dept) {
      return res.status(404).json({
        error: 'Drug not found or already deleted',
      });
    }

    res.json({
      message: ' Drug soft-deleted',
      Drug: dept,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
