import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Bed from '../models/bedsModel';
import Ward from '../models/wardModel';

import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildBedFilter } from './filters/bedFilters';

export const getBeds = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildBedFilter({
      clinicId: req.user.clinicId,
      role: req.user.role,
      search,
    });

    const [beds, total] = await Promise.all([
      Bed.find(filter)
        .populate('ward')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Bed.countDocuments(filter),
    ]);

    res.status(200).json({
      data: beds,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getBedOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;

    const statusFilter =
      req.user?.role === "admin"
        ? { $in: ['available', 'occupied', 'maintenance', 'reserved'] }
        : { $in: ['available', 'reserved'] };

    const result = await Bed.find({
      clinic: clinicId,
      status: statusFilter,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    }).select("labTest status uuid");

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

async function getNextBedNumber(
  wardCode: string,
  genderCode: string,
  clinicId: string
) {
  const prefix = `${wardCode}-${genderCode}`;

  const count = await Bed.countDocuments({
    clinic: clinicId,
    bedNumber: { $regex: `^${prefix}-` },
    isDeleted: { $ne: true },
  });

  const nextNumber = count + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

export const createBed = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid, ward, type, status } = req.body;

    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const wardData: any = await Ward.findById(ward).select("type gender");
    if (!wardData) {
      return res.status(404).json({ message: "Ward not found" });
    }

    const wardCode = wardData.type.toUpperCase().slice(0, 3);
    const genderCode =
      wardData.gender === "male"
        ? "M"
        : wardData.gender === "female"
        ? "F"
        : "O";

    // 🔢 Count-based increment (your requirement)
    const bedNumber = await getNextBedNumber(
      wardCode,
      genderCode,
      req.user.clinicId
    );

    const bed = await Bed.findOneAndUpdate(
      { uuid },
      {
        $set: {
          bedNumber,
          ward,
          wardType: wardData.type,
          gender: wardData.gender,
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
      { upsert: true, new: true }
    );

    res.status(201).json(bed);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



// controllers/DrugController.js


