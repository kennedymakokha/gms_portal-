import { Request, Response } from "express";
import { Types } from "mongoose";

import Prescription from "../models/prescriptionModel";
import Medicine from "../models/medicineModel";

const generateReference = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `RX-${year}${month}${day}-${Date.now().toString().slice(-6)}`;
};

export const getPrescriptions = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();

    const filter: any = {};

    if (status && ["Pending", "Verified"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { reference: regex },
        { patient: regex },
        { medicineName: regex },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate("medicine", "name batch")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Prescription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get prescriptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
    });
  }
};

export const getPrescriptionById = async (
  req: Request,
  res: Response
) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const prescription = await Prescription.findById(req.params.id)
      .populate("medicine", "name batch");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Get prescription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
    });
  }
};

export const createPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const patient = String(req.body.patient || "").trim();
    const medicineId = String(req.body.medicine || "").trim();
    const notes = String(req.body.notes || "").trim();

    if (!patient || !medicineId) {
      return res.status(400).json({
        success: false,
        message: "Patient name and medicine are required",
      });
    }

    if (!Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
    }

    const medicine = await Medicine.findOne({
      _id: medicineId,
      isDeleted: { $ne: true },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const prescription = await Prescription.create({
      reference: generateReference(),
      patient,
      medicine: medicine._id,
      medicineName: medicine.name,
      notes,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Prescription recorded successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Create prescription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record prescription",
    });
  }
};

export const verifyPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const prescription = await Prescription.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "Pending",
      },
      {
        $set: {
          status: "Verified",
          verifiedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("medicine", "name batch");

    if (!prescription) {
      const existing = await Prescription.exists({
        _id: req.params.id,
      });

      return res.status(existing ? 409 : 404).json({
        success: false,
        message: existing
          ? "Prescription has already been verified"
          : "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription verified successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Verify prescription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify prescription",
    });
  }
};