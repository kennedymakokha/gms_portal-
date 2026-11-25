
import { Response } from "express";
import { Types } from "mongoose";

import type { AuthRequest } from "../middleware/auth";

import Medicine from "../models/medicineModel";
import Category from "../models/categoriesModel";

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const getPharmacyId = (
  req: AuthRequest,
  res: Response
): Types.ObjectId | null => {
  const pharmacyId = req.user?.pharmacyId;

  if (!pharmacyId || !isValidObjectId(pharmacyId)) {
    res.status(403).json({
      ok: false,
      message: "A valid pharmacy assignment is required.",
    });

    return null;
  }

  return new Types.ObjectId(pharmacyId);
};

const getMedicinePayload = (body: any) => ({
  name: String(body?.name || "").trim(),
  category: String(body?.category || "").trim(),
  manufacturer: String(body?.manufacturer || "").trim(),
  batch: String(body?.batch || "").trim(),
  expiry: new Date(body?.expiry),
  price: Number(body?.price),
  quantity:
    body?.quantity === undefined ? undefined : Number(body.quantity),
  reorder:
    body?.reorder === undefined ? 10 : Number(body.reorder),
});

const validateMedicine = (
  data: ReturnType<typeof getMedicinePayload>,
  requireQuantity = true
) => {
  if (!data.name) return "Medicine name is required.";

  if (!data.category || !isValidObjectId(data.category)) {
    return "Please select a valid category.";
  }

  if (!data.batch) return "Batch number is required.";

  if (
    !data.expiry ||
    Number.isNaN(data.expiry.getTime())
  ) {
    return "A valid expiry date is required.";
  }

  if (!Number.isFinite(data.price) || data.price < 0) {
    return "Price must be a valid non-negative number.";
  }

  if (requireQuantity && data.quantity === undefined) {
    return "Quantity is required.";
  }

  if (
    data.quantity !== undefined &&
    (!Number.isSafeInteger(data.quantity) || data.quantity < 0)
  ) {
    return "Quantity must be a non-negative whole number.";
  }

  if (
    !Number.isSafeInteger(data.reorder) ||
    data.reorder < 0
  ) {
    return "Reorder level must be a non-negative whole number.";
  }

  return null;
};

const categoryExists = async (
  categoryId: string,
  pharmacyId: Types.ObjectId
) => {
  return Category.exists({
    _id: categoryId,
    pharmacy: pharmacyId,
    isDeleted: { $ne: true },
  });
};

// GET MEDICINES
export const getMedicines = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const filter: any = {
      pharmacy: pharmacyId,
      isDeleted: { $ne: true },
    };

    if (category) {
      if (!isValidObjectId(category)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid category ID.",
        });
      }

      const exists = await categoryExists(category, pharmacyId);

      if (!exists) {
        return res.status(400).json({
          ok: false,
          message: "Category not found in your pharmacy.",
        });
      }

      filter.category = new Types.ObjectId(category);
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const matchingCategories = await Category.find({
        pharmacy: pharmacyId,
        name: { $regex: escapedSearch, $options: "i" },
        isDeleted: { $ne: true },
      }).select("_id");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { manufacturer: { $regex: escapedSearch, $options: "i" } },
        { batch: { $regex: escapedSearch, $options: "i" } },
        {
          category: {
            $in: matchingCategories.map((item) => item._id),
          },
        },
      ];
    }

    const [medicines, total] = await Promise.all([
      Medicine.find(filter)
        .populate({
          path: "category",
          select: "name uuid",
          match: { pharmacy: pharmacyId },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Medicine.countDocuments(filter),
    ]);

    return res.status(200).json({
      ok: true,
      data: medicines,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get medicines error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to fetch medicines.",
    });
  }
};

// GET MEDICINE BY ID
export const getMedicineById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid medicine ID.",
      });
    }

    const medicine = await Medicine.findOne({
      _id: id,
      pharmacy: pharmacyId,
      isDeleted: { $ne: true },
    }).populate({
      path: "category",
      select: "name uuid",
      match: { pharmacy: pharmacyId },
    });

    if (!medicine) {
      return res.status(404).json({
        ok: false,
        message: "Medicine not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Get medicine error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to fetch medicine.",
    });
  }
};

// CREATE MEDICINE
export const createMedicine = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const payload = getMedicinePayload(req.body);
    const validationError = validateMedicine(payload);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        message: validationError,
      });
    }

    const exists = await categoryExists(
      payload.category,
      pharmacyId
    );

    if (!exists) {
      return res.status(400).json({
        ok: false,
        message: "The selected category does not exist or has been deleted.",
      });
    }

    let uuid = String(req.body.uuid || "").trim();

    if (!uuid) {
      const count = await Medicine.countDocuments({
        pharmacy: pharmacyId,
      });

      uuid = `MED-${String(count + 1).padStart(5, "0")}-${Date.now()}`;
    }

    const medicineData = {
      name: payload.name,
      category: new Types.ObjectId(payload.category),
      manufacturer: payload.manufacturer,
      batch: payload.batch,
      expiry: payload.expiry,
      price: payload.price,
      quantity: payload.quantity,
      reorder: payload.reorder,
      uuid,
      pharmacy: pharmacyId,
      isDeleted: false,
      deletedAt: null,
    };

    const medicine = await Medicine.create(medicineData);

    const populatedMedicine = await Medicine.findOne({
      _id: medicine._id,
      pharmacy: pharmacyId,
    }).populate({
      path: "category",
      select: "name uuid",
      match: { pharmacy: pharmacyId },
    });

    return res.status(201).json({
      ok: true,
      message: "Medicine created successfully.",
      data: populatedMedicine,
    });
  } catch (error: any) {
    console.error("Create medicine error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "A medicine with this name, batch number or UUID already exists.",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Failed to create medicine.",
    });
  }
};

// UPDATE MEDICINE
export const updateMedicine = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid medicine ID.",
      });
    }

    const existingMedicine = await Medicine.findOne({
      _id: id,
      pharmacy: pharmacyId,
      isDeleted: { $ne: true },
    });

    if (!existingMedicine) {
      return res.status(404).json({
        ok: false,
        message: "Medicine not found.",
      });
    }

    const payload = getMedicinePayload(req.body);
    const validationError = validateMedicine(payload, false);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        message: validationError,
      });
    }

    const exists = await categoryExists(
      payload.category,
      pharmacyId
    );

    if (!exists) {
      return res.status(400).json({
        ok: false,
        message: "The selected category does not exist or has been deleted.",
      });
    }

    const updateData: any = {
      name: payload.name,
      category: new Types.ObjectId(payload.category),
      manufacturer: payload.manufacturer,
      batch: payload.batch,
      expiry: payload.expiry,
      price: payload.price,
      reorder: payload.reorder,
    };

    // Preserve stock if quantity was not supplied.
    if (payload.quantity !== undefined) {
      updateData.quantity = payload.quantity;
    }

    const medicine = await Medicine.findOneAndUpdate(
      {
        _id: id,
        pharmacy: pharmacyId,
        isDeleted: { $ne: true },
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "category",
      select: "name uuid",
      match: { pharmacy: pharmacyId },
    });

    return res.status(200).json({
      ok: true,
      message: "Medicine updated successfully.",
      data: medicine,
    });
  } catch (error: any) {
    console.error("Update medicine error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "A medicine with this name and batch number already exists.",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Failed to update medicine.",
    });
  }
};

// SOFT DELETE MEDICINE
export const deleteMedicine = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid medicine ID.",
      });
    }

    const medicine = await Medicine.findOneAndUpdate(
      {
        _id: id,
        pharmacy: pharmacyId,
        isDeleted: { $ne: true },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!medicine) {
      return res.status(404).json({
        ok: false,
        message: "Medicine not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Medicine deleted successfully.",
    });
  } catch (error) {
    console.error("Delete medicine error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to delete medicine.",
    });
  }
};
