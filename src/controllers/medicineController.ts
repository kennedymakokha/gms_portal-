import { Request, Response } from "express";
import { Types } from "mongoose";

import Medicine from "../models/medicineModel";
import Category from '../models/categoriesModel';
const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const getMedicinePayload = (body: any) => ({
    name: String(body?.name || "").trim(),
    category: String(body?.category || "").trim(),
    manufacturer: String(body?.manufacturer || "").trim(),
    batch: String(body?.batch || "").trim(),
    expiry: new Date(body?.expiry),
    price: Number(body?.price),
    quantity: Number(body?.quantity ?? 0),
    reorder: Number(body?.reorder ?? 10),
});

const validateMedicine = (data: ReturnType<typeof getMedicinePayload>) => {
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

    if (
        !Number.isFinite(data.price) ||
        data.price < 0
    ) {
        return "Price must be a valid non-negative number.";
    }

    if (
        !Number.isFinite(data.quantity) ||
        data.quantity < 0
    ) {
        return "Quantity must be a valid non-negative number.";
    }

    if (
        !Number.isFinite(data.reorder) ||
        data.reorder < 0
    ) {
        return "Reorder level must be a valid non-negative number.";
    }

    return null;
};

const categoryExists = async (categoryId: string) => {
    return Category.exists({
        _id: categoryId,
        isDeleted: { $ne: true },
    });
};

// GET /api/medicines
export const getMedicines = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 10)
        );

        const skip = (page - 1) * limit;

        const search = String(req.query.search || "").trim();
        const category = String(req.query.category || "").trim();

        const filter: any = {
            isDeleted: { $ne: true },
        };

        if (category) {
            if (!isValidObjectId(category)) {
                return res.status(400).json({
                    ok: false,
                    message: "Invalid category ID.",
                });
            }

            filter.category = category;
        }

        if (search) {
            const matchingCategories = await Category.find({
                name: { $regex: search, $options: "i" },
                isDeleted: { $ne: true },
            }).select("_id");

            const categoryIds = matchingCategories.map(
                (item: any) => item._id
            );

            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { manufacturer: { $regex: search, $options: "i" } },
                { batch: { $regex: search, $options: "i" } },
                { category: { $in: categoryIds } },
            ];
        }

        const [medicines, total] = await Promise.all([
            Medicine.find(filter)
                .populate("category", "name uuid")
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

// GET /api/medicines/:id
export const getMedicineById = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid medicine ID.",
            });
        }

        const medicine = await Medicine.findOne({
            _id: id,
            isDeleted: { $ne: true },
        }).populate("category", "name uuid");

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

// POST /api/medicines
export const createMedicine = async (
    req: Request,
    res: Response
) => {
    try {
        const payload = getMedicinePayload(req.body);
        const validationError = validateMedicine(payload);

        if (validationError) {
            return res.status(400).json({
                ok: false,
                message: validationError,
            });
        }

        const exists = await categoryExists(payload.category);

        if (!exists) {
            return res.status(400).json({
                ok: false,
                message: "The selected category does not exist or has been deleted.",
            });
        }

        const medicine = await Medicine.create({
            ...payload,
            category: new Types.ObjectId(payload.category),
        });

        const populatedMedicine = await Medicine.findById(
            medicine._id
        ).populate("category", "name uuid");

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
                message: "A medicine with this name and batch number already exists.",
            });
        }

        return res.status(500).json({
            ok: false,
            message: "Failed to create medicine.",
        });
    }
};

// PUT /api/medicines/:id
export const updateMedicine = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid medicine ID.",
            });
        }

        const payload = getMedicinePayload(req.body);
        const validationError = validateMedicine(payload);

        if (validationError) {
            return res.status(400).json({
                ok: false,
                message: validationError,
            });
        }

        const exists = await categoryExists(payload.category);

        if (!exists) {
            return res.status(400).json({
                ok: false,
                message: "The selected category does not exist or has been deleted.",
            });
        }

        const medicine = await Medicine.findOneAndUpdate(
            {
                _id: id,
                isDeleted: { $ne: true },
            },
            {
                ...payload,
                category: new Types.ObjectId(payload.category),
            },
            {
                new: true,
                runValidators: true,
            }
        ).populate("category", "name uuid");

        if (!medicine) {
            return res.status(404).json({
                ok: false,
                message: "Medicine not found.",
            });
        }

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

// DELETE /api/medicines/:id
export const deleteMedicine = async (
    req: Request,
    res: Response
) => {
    try {
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
                isDeleted: { $ne: true },
            },
            {
                isDeleted: true,
                deletedAt: new Date(),
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