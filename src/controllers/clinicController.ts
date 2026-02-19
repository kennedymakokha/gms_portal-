import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';

import Branch from '../models/branchModel';
import Clinic from '../models/clinicModel';
import { buildClinicFilter } from './filters/clinicFilters';
import { generateSmartAbbreviation, getNextNumber, getNextNumberWithoutBranch } from '../utils/getNextNumber';
import mongoose from 'mongoose';
import { generateUnifiedId } from './patientController';
import { buildBranchFilter } from './filters/branchFilters';



export const saveClinic = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let { uuid, name, phone, isDeleted = false } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Clinic name and code are required",
      });
    }



    // 🔢 Generate UUID only if creating new clinic
    if (!uuid) {
      uuid = await generateUnifiedId('clinic')
    }
    const ALLOWED_UPDATE_FIELDS = [
      "phone",
      "name",
      "branches",
      "isDeleted",
      "deletedAt",

    ];

    const updateData: any = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const clinic = await Clinic.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          created_by: req.user?.id,
        },
        ...(Object.keys(updateData).length && { $set: updateData }),
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Clinic saved successfully",
      clinic,
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error saving clinic:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const saveBranch = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let { uuid, branchName, phone, clinic, isDeleted = false } = req.body;

    if (!branchName) {
      return res.status(400).json({
        message: "Branch Name is required",
      });
    }
    const clinicName = await Clinic.findById(clinic).session(session);
    // 🔢 Generate UUID only if creating new clinic
    if (!uuid) {
      uuid = await getNextNumberWithoutBranch({
        base: `${generateSmartAbbreviation(`${clinicName?.name}`)}`,
        department:"BRC",
        clinicId: clinic,
        session,
      });
    }
    const ALLOWED_UPDATE_FIELDS = [
      "phone",
      "branchName",
      "inpatient",
      "head",
      "isDeleted",
      "deletedAt",

    ];

    const updateData: any = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const branch = await Branch.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          created_by: req.user?.id,
        },
        ...(Object.keys(updateData).length && { $set: updateData }),
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
        session,

      }
    );
    await Clinic.findByIdAndUpdate(
      clinic,
      { $push: { branches: branch._id } },
      { session }
    );
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "branch saved successfully",
      branch,
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error saving clinic:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
export const getclinics = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildClinicFilter({ search });

    const [clinics, total] = await Promise.all([
      Clinic.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Clinic.countDocuments(filter),
    ]);

    res.status(200).json({
      data: clinics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: error.message });
  }
};
export const getbranches = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildBranchFilter({ search });

    const [btanches, total] = await Promise.all([
      Branch.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Branch.countDocuments(filter),
    ]);

    res.status(200).json({
      data: btanches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: error.message });
  }
};


export const deleteClinic = async (req: AuthRequest, res: Response) => {
  try {
    const clinix = await Clinic.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!clinix) {
      return res.status(404).json({ message: 'clinic not found' });
    }

    res.json({ message: ' clinic deleted', clinix });
  } catch (error: any) {
    console.error(' Error deleting clinix:', error);
    res.status(500).json({ message: error.message });
  }
};
