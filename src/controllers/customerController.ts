
import { Response } from "express";
import { Types } from "mongoose";

import { AuthRequest } from "../middleware/auth";
import Customer from "../models/customerModel";

const getPharmacyId = (req: AuthRequest): Types.ObjectId | null => {
    const pharmacyId = req.user?.pharmacyId;

    if (!pharmacyId || !Types.ObjectId.isValid(pharmacyId)) {
        return null;
    }

    return new Types.ObjectId(pharmacyId);
};

// GET CUSTOMERS
export const getCustomers = async (
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
            isDeleted: { $ne: true },
        };

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { name: { $regex: escaped, $options: "i" } },
                { phone: { $regex: escaped, $options: "i" } },
                { email: { $regex: escaped, $options: "i" } },
            ];
        }

        const [customers, total] = await Promise.all([
            Customer.find(filter)
                .sort({ name: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Customer.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: customers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get customers error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
        });
    }
};

// GET CUSTOMER BY ID
export const getCustomerById = async (
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
                message: "Invalid customer ID",
            });
        }

        const customer = await Customer.findOne({
            _id: id,
            pharmacy: pharmacyId,
            isDeleted: { $ne: true },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        console.error("Get customer error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer",
        });
    }
};

// CREATE CUSTOMER
export const createCustomer = async (
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

        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const address = String(req.body.address || "").trim();

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: "Customer name and phone number are required",
            });
        }

        // Check duplicate phone number within this pharmacy only.
        const existing = await Customer.findOne({
            pharmacy: pharmacyId,
            phone,
            isDeleted: { $ne: true },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A customer with this phone number already exists",
            });
        }

        const customer = await Customer.create({
            pharmacy: pharmacyId,
            name,
            phone,
            email,
            address,
            isDeleted: false,
            deletedAt: null,
        });

        return res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer,
        });
    } catch (error: any) {
        console.error("Create customer error:", error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A customer with this phone number already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create customer",
        });
    }
};

// UPDATE CUSTOMER
export const updateCustomer = async (
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
                message: "Invalid customer ID",
            });
        }

        const updates: Record<string, string> = {};

        if (req.body.name !== undefined) {
            updates.name = String(req.body.name).trim();

            if (!updates.name) {
                return res.status(400).json({
                    success: false,
                    message: "Customer name cannot be empty",
                });
            }
        }

        if (req.body.phone !== undefined) {
            updates.phone = String(req.body.phone).trim();

            if (!updates.phone) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number cannot be empty",
                });
            }

            // Prevent duplicate phone numbers within this pharmacy.
            const existing = await Customer.findOne({
                pharmacy: pharmacyId,
                phone: updates.phone,
                _id: { $ne: id },
                isDeleted: { $ne: true },
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "Another customer already uses this phone number",
                });
            }
        }

        if (req.body.email !== undefined) {
            updates.email = String(req.body.email).trim().toLowerCase();
        }

        if (req.body.address !== undefined) {
            updates.address = String(req.body.address).trim();
        }

        const customer = await Customer.findOneAndUpdate(
            {
                _id: id,
                pharmacy: pharmacyId,
                isDeleted: { $ne: true },
            },
            {
                $set: updates,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer,
        });
    } catch (error: any) {
        console.error("Update customer error:", error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Another customer already uses this phone number",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update customer",
        });
    }
};

// DELETE CUSTOMER (SOFT DELETE)
export const deleteCustomer = async (
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
                message: "Invalid customer ID",
            });
        }

        const customer = await Customer.findOneAndUpdate(
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

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        console.error("Delete customer error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete customer",
        });
    }
};
