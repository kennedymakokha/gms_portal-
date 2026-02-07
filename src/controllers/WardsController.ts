import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Ward from '../models/wardModel';


export const getWards = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string)?.trim();

    const statusFilter =
      req.user?.role === "admin"
        ? { $in: ['available', 'occupied', 'maintenance', 'reserved'] }
        : { $in: ['available', 'reserved'] };

    const skip = (page - 1) * limit;

    const filter: any = {
      clinic: req.user?.clinicId,
      status: statusFilter,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    };

    // 🔍 Search by name / phone / nationalId
    if (search) {
      filter.$and = [
        {
          $or: [
            { wardName: { $regex: search, $options: 'i' } },
            
          ],
        },
      ];
    }


    const [wards, total] = await Promise.all([
      Ward.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Ward.countDocuments(filter),
    ]);

    res.status(200).json({
      data: wards,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    ;

  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getWardOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;

    const statusFilter =
      req.user?.role === "admin"
        ? { $in: ['available', 'occupied', 'maintenance', 'reserved'] }
        : { $in: ['available', 'reserved'] };

    const result = await Ward.find({
      clinic: clinicId,
      status: statusFilter,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    }).select("wardName status uuid");

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const createWard = async (req: AuthRequest, res: Response) => {

  try {
    const { uuid, wardName,
      gender,
      type, status } = req.body;
    const wardData = await Ward.findOneAndUpdate(
      { uuid },
      {
        $set: {
          wardName,
          gender,
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
    res.status(201).json(wardData);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

// controllers/wardController.js


