import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Bed from '../models/bedsModel';


export const getBeds = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await Bed.find({ deletedAt: null, isDeleted: false, clinic: req.user?.clinicId });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// export const deleteAllBed = async (req: AuthRequest, res: Response) => {
//   try {
//     await Bed.deleteMany({});
//     res.json({ message: 'All Bed deleted successfully' });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const createBed = async (req: AuthRequest, res: Response) => {

  try {
    const { uuid, bedNumber,
      ward,
      type, status } = req.body;
    const drug = await Bed.findOneAndUpdate(
      { uuid },
      {
        $set: {
          bedNumber,
          ward,
          type,
          status,
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


