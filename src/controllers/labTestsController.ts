import mongoose from 'mongoose';
import { Response } from 'express';
import Labs, { ILab } from '../models/labModel';
import { AuthRequest } from '../middleware/auth';

export const getLabs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string)?.trim();

    const statusFilter =
      req.user?.role === "admin"
        ? { $in: ["active", "inactive"] }
        : "active";

    const skip = (page - 1) * limit;

    const filter: any = {
      clinic: req.user?.clinicId,
      status:statusFilter,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    };

    // 🔍 Search by name / phone / nationalId
    if (search) {
      filter.$and = [
        {
          $or: [
            { testName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },

          ],
        },
      ];
    }
  

    const [labs, total] = await Promise.all([
      Labs.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

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
    ;

  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};



export const createlab = async (req: AuthRequest, res: Response) => {
  try {

    const { testName,
      category,
      turnaroundTime,
      requiresFasting, uuid, price, status } = req.body;
    const lab = await Labs.findOneAndUpdate(
      { uuid },
      {
        $set: {
          testName,
          price,
          category,
          turnaroundTime,
          requiresFasting,
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
    res.status(201).json(lab);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLabOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;

    const statusFilter =
      req.user?.role === "admin"
        ? { $in: ["active", "inactive"] }
        : "active";

    const result = await Labs.find({
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
