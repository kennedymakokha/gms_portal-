import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Drugs from '../models/deptModel';
import clinicModel from '../models/clinicModel';

export const getDrugs = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await Drugs.find({ deletedAt: null, isDeleted: false, clinic: req.user?.clinicId });
    res.json(depts);
  } catch (error: any) {
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
    const { name, price, uuid, clinic, stock } = req.body;
  
    // check by uuid first, fallback to name
    const existing = await Drugs.findOne({ $or: [{ uuid }, { name }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }

    const dept = new Drugs({
      uuid,
      name,
      clinic,
      price, stock,
      created_by: req.user?.id
    });

    let V = await dept.save();
    console.log("DRUG after", V)
    res.status(201).json(dept);
  } catch (error: any) {
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
    console.log('PARAMS:', req.params);

    const { id } = req.params; // or uuid — whichever you chose
    console.log('DELETE ID:', id);

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
