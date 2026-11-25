
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Pharmacy from "../models/pharmacyModel";
import Branch from "../models/branchModel";
import Counter from "../models/CounterModel";
import User from "../models/userModel";
import { getPagination } from "../utils/pagination";
import { parseQueryParam } from "../utils/queryParser";
import mongoose from "mongoose";

export const getPharmacys = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter: any = {
      isActive: true,
    };

    if (search) {
      filter.$or = [
        { name: search },
        { phone_number: search },
        { email: search },
        { address: search },
      ];
    }

    const [pharmacies, total] = await Promise.all([
      Pharmacy.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Pharmacy.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: pharmacies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching pharmacies:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPharmacy = async (
  req: AuthRequest,
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    const {
      name,
      phone_number,
      email,
      address,
      registration_number,
      kra_pin,
      logo,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy name is required",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let result: any;

    await session.withTransaction(async () => {
      const admin = await User.findById(req.user!.id).session(session);

      if (!admin) {
        throw new Error("Authenticated administrator was not found");
      }

      // Create pharmacy
      const [pharmacy] = await Pharmacy.create(
        [
          {
            name: name.trim(),
            phone_number,
            email,
            address,
            registration_number,
            kra_pin,
            logo,
            currency: "KES",
            timezone: "Africa/Nairobi",
            createdBy: admin._id,
            isActive: true,
          },
        ],
        { session }
      );

      // Create the first branch automatically
      const [mainBranch] = await Branch.create(
        [
          {
            branchName: "Main Branch",
            uuid: `MAIN-${pharmacy._id}`,
            pharmacy: pharmacy._id,
            created_by: admin._id,
            phone_number: phone_number || admin.phone_number,
            address: address || "Main Branch",
            isDeleted: false,
            deletedAt: null,
            departments: [],
          },
        ],
        { session }
      );

      // Attach administrator to pharmacy and main branch
      admin.pharmacy = pharmacy._id;
      admin.branch = mainBranch._id;

      await admin.save({ session });

      // Create the initial branch counter
      await Counter.findOneAndUpdate(
        {
          pharmacy: pharmacy._id,
          branch: mainBranch._id,
          key: "default",
        },
        {
          $setOnInsert: {
            pharmacy: pharmacy._id,
            branch: mainBranch._id,
            key: "default",
            seq: 0,
          },
        },
        {
          upsert: true,
          new: true,
          session,
        }
      );

      result = {
        pharmacy,
        branch: mainBranch,
        administrator: {
          id: admin._id,
          name: admin.name,
          username: admin.username,
          role: admin.role,
        },
      };
    });

    return res.status(201).json({
      success: true,
      message: "Pharmacy and Main Branch created successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating pharmacy:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create pharmacy",
    });
  } finally {
    await session.endSession();
  }
};

export const updatePharmacy = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    const {
      name,
      phone_number,
      email,
      address,
      registration_number,
      kra_pin,
      logo,
    } = req.body;

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          phone_number,
          email,
          address,
          registration_number,
          kra_pin,
          logo,
        },
      },
      { new: true, runValidators: true }
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pharmacy updated successfully",
      data: pharmacy,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const harddeletePharmacy = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const pharmacy = await Pharmacy.findOneAndDelete({ uuid: id });

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pharmacy deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePharmacy = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { uuid: id, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found or already inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pharmacy deactivated successfully",
      data: pharmacy,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
