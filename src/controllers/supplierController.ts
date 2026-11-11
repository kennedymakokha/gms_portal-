
import { Request, Response } from "express";
import { Types } from "mongoose";
import Supplier from "../models/supplierModel";

const getSupplierPayload = (body: any) => ({
  name: String(body.name || "").trim(),
  phone: String(body.phone || "").trim(),
  email: String(body.email || "").trim().toLowerCase(),
  address: String(body.address || "").trim(),
  contactPerson: String(body.contactPerson || "").trim(),
});

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();

    const filter: any = { isDeleted: false };

    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { contactPerson: regex },
      ];
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Supplier.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
    });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    console.error("Get supplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier",
    });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const payload = getSupplierPayload(req.body);

    if (!payload.name || !payload.phone) {
      return res.status(400).json({
        success: false,
        message: "Supplier name and phone are required",
      });
    }

    const supplier = await Supplier.create(payload);

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A supplier with this phone number already exists",
      });
    }

    console.error("Create supplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create supplier",
    });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const payload = getSupplierPayload(req.body);

    if (!payload.name || !payload.phone) {
      return res.status(400).json({
        success: false,
        message: "Supplier name and phone are required",
      });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      payload,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A supplier with this phone number already exists",
      });
    }

    console.error("Update supplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update supplier",
    });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Delete supplier error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
    });
  }
};