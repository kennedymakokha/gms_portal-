
import { Response } from "express";
import { Types } from "mongoose";

import { AuthRequest } from "../middleware/auth";
import Supplier from "../models/supplierModel";

const getPharmacyId = (req: AuthRequest): Types.ObjectId | null => {
    const pharmacyId = req.user?.pharmacyId;

    if (!pharmacyId || !Types.ObjectId.isValid(pharmacyId)) {
        return null;
    }

    return new Types.ObjectId(pharmacyId);
};

const getSupplierPayload = (body: any) => ({
    name: String(body.name || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    address: String(body.address || "").trim(),
    contactPerson: String(body.contactPerson || "").trim(),
});

// GET SUPPLIERS
export const getSuppliers = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const pharmacyId = getPharmacyId(req);

        if (!pharmacyId) {
            return res.status(403).json({
                success: false,
                message: "Your account is not associated with a valid pharmacy.",
            });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const search = String(req.query.search || "").trim();

        const filter: Record<string, any> = {
            pharmacy: pharmacyId,
            isDeleted: false,
        };

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const regex = new RegExp(escaped, "i");

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

// GET SUPPLIER BY ID
export const getSupplierById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const pharmacyId = getPharmacyId(req);

        if (!pharmacyId) {
            return res.status(403).json({
                success: false,
                message: "Your account is not associated with a valid pharmacy.",
            });
        }

        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID",
            });
        }

        const supplier = await Supplier.findOne({
            _id: id,
            pharmacy: pharmacyId,
            isDeleted: false,
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: supplier,
        });
    } catch (error) {
        console.error("Get supplier error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch supplier",
        });
    }
};

// CREATE SUPPLIER
export const createSupplier = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const pharmacyId = getPharmacyId(req);

        if (!pharmacyId) {
            return res.status(403).json({
                success: false,
                message: "Your account is not associated with a valid pharmacy.",
            });
        }

        const payload = getSupplierPayload(req.body);

        if (!payload.name || !payload.phone) {
            return res.status(400).json({
                success: false,
                message: "Supplier name and phone are required",
            });
        }

        const existing = await Supplier.findOne({
            pharmacy: pharmacyId,
            phone: payload.phone,
            isDeleted: false,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A supplier with this phone number already exists",
            });
        }

        const supplier = await Supplier.create({
            ...payload,
            pharmacy: pharmacyId,
            isDeleted: false,
            deletedAt: null,
        });

        return res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            data: supplier,
        });
    } catch (error: any) {
        console.error("Create supplier error:", error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A supplier with this phone number already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create supplier",
        });
    }
};

// UPDATE SUPPLIER
export const updateSupplier = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const pharmacyId = getPharmacyId(req);

        if (!pharmacyId) {
            return res.status(403).json({
                success: false,
                message: "Your account is not associated with a valid pharmacy.",
            });
        }

        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
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

        const existing = await Supplier.findOne({
            pharmacy: pharmacyId,
            phone: payload.phone,
            _id: { $ne: id },
            isDeleted: false,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Another supplier already uses this phone number",
            });
        }

        const supplier = await Supplier.findOneAndUpdate(
            {
                _id: id,
                pharmacy: pharmacyId,
                isDeleted: false,
            },
            {
                $set: payload,
            },
            {
                new: true,
                runValidators: true,
            }
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
        console.error("Update supplier error:", error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A supplier with this phone number already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update supplier",
        });
    }
};

// DELETE SUPPLIER (SOFT DELETE)
export const deleteSupplier = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const pharmacyId = getPharmacyId(req);

        if (!pharmacyId) {
            return res.status(403).json({
                success: false,
                message: "Your account is not associated with a valid pharmacy.",
            });
        }

        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID",
            });
        }

        const supplier = await Supplier.findOneAndUpdate(
            {
                _id: id,
                pharmacy: pharmacyId,
                isDeleted: false,
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
