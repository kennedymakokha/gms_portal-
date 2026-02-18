import mongoose from 'mongoose';
import { Response } from 'express';
import Labs, { ILab } from '../models/labModel';
import { AuthRequest } from '../middleware/auth';
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildLabTestFilter } from './filters/labTestFilters';
import { getNextNumber } from '../utils/getNextNumber';


export const getLabs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);
    const status = parseQueryParam(req.query.status as string);

    const filter = buildLabTestFilter({
      clinicId: req.user.clinicId,
      role: req.user.role,
      search,
      status,
    });

    const [labs, total] = await Promise.all([
      Labs.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Labs.countDocuments(filter),
    ]);

    res.status(200).json({
      data: labs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ message: error.message });
  }
};


export const createlab = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user?.clinicId || !req.user?.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clinicId = req.user.clinicId;
    const userId = req.user.id;

    let {
      testName,
      category,
      turnaroundTime,
      requiresFasting,
      uuid,
      price,
      status,
    } = req.body;

    // Generate UUID inside transaction
    if (!uuid) {
      uuid = await getNextNumber({
        base: "tst",
        clinicId,
        session, // 🔥 pass session here
      });
    }

    const lab = await Labs.findOneAndUpdate(
      { uuid, clinic: clinicId },
      {
        $set: {
          testName,
          price,
          category,
          turnaroundTime,
          requiresFasting,
          status,
          clinic: clinicId,
          isDeleted: req.body.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_by: userId,
          created_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        session, // 🔥 attach session here
      }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(lab);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: error.message });
  }
};


export const getLabOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;

    // const statusFilter =
    //   req.user?.role === "admin"
    //     ? { $in: ["active", "inactive"] }
    //     : "active";

    const result = await Labs.find({
      // clinic: clinicId,
      // status: statusFilter,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    }).select("testName status uuid price");

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
