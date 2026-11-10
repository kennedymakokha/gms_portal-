
import { Request, Response } from "express";
import { Types } from "mongoose";

import Purchase from "../models/purchaseModel";
import Medicine from "../models/medicineModel";

const generateOrderNumber = () =>
  `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();

    const filter: Record<string, any> = {};

    if (status && ["Pending", "Received"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
        { medicineName: { $regex: search, $options: "i" } },
      ];
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate("medicine", "name batch quantity price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get purchases error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase orders",
    });
  }
};

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const supplier = String(req.body.supplier || "").trim();
    const medicineId = String(req.body.medicine || "").trim();
    const quantity = Number(req.body.quantity);
    const unitCost = Number(req.body.unitCost);

    if (!supplier || !medicineId || !Types.ObjectId.isValid(medicineId)) {
      return res.status(400).json({
        success: false,
        message: "Supplier and a valid medicine are required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number greater than zero",
      });
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      return res.status(400).json({
        success: false,
        message: "Unit cost must be a valid non-negative amount",
      });
    }

    const medicine = await Medicine.findOne({
      _id: new Types.ObjectId(medicineId),
      isDeleted: { $ne: true },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const purchase = await Purchase.create({
      orderNumber: generateOrderNumber(),
      supplier,
      medicine: medicine._id,
      medicineName: medicine.name,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("Create purchase error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create purchase order",
    });
  }
};

export const receivePurchase = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase order ID",
      });
    }

    // Claim the pending order first. This prevents two requests from
    // receiving the same order and incrementing stock twice.
    const purchase = await Purchase.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        status: "Pending",
      },
      {
        $set: {
          status: "Received",
          receivedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!purchase) {
      const existing = await Purchase.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This purchase order has already been received",
      });
    }

    try {
      const medicineUpdate = await Medicine.updateOne(
        {
          _id: purchase.medicine,
          isDeleted: { $ne: true },
        },
        {
          $inc: { quantity: purchase.quantity },
        }
      );

      if (medicineUpdate.matchedCount === 0) {
        throw new Error("The medicine linked to this order no longer exists");
      }
    } catch (stockError) {
      // Restore Pending if stock could not be updated.
      await Purchase.updateOne(
        { _id: purchase._id, status: "Received" },
        {
          $set: {
            status: "Pending",
            receivedAt: null,
          },
        }
      );

      throw stockError;
    }

    return res.status(200).json({
      success: true,
      message: "Purchase received and stock updated successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("Receive purchase error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to receive purchase order",
    });
  }
};
