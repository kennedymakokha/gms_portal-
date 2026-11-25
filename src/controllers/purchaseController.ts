
import { Response } from "express";
import { Types } from "mongoose";


import Purchase from "../models/purchaseModel";
import Medicine from "../models/medicineModel";
import { AuthRequest } from "../middleware/auth";

const generateOrderNumber = () =>
    `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const getPharmacyId = (req: AuthRequest): Types.ObjectId | null => {
    const pharmacyId = req.user?.pharmacyId;

    if (!pharmacyId || !Types.ObjectId.isValid(pharmacyId)) {
        return null;
    }

    return new Types.ObjectId(pharmacyId);
};

// GET PURCHASES
export const getPurchases = async (
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
        const skip = (page - 1) * limit;

        const search = String(req.query.search || "").trim();
        const status = String(req.query.status || "").trim();

        const filter: Record<string, any> = {
            pharmacy: pharmacyId,
        };

        if (status && ["Pending", "Received"].includes(status)) {
            filter.status = status;
        }

        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { orderNumber: { $regex: escapedSearch, $options: "i" } },
                { supplier: { $regex: escapedSearch, $options: "i" } },
                { medicineName: { $regex: escapedSearch, $options: "i" } },
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

// CREATE PURCHASE
export const createPurchase = async (
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

        if (!Number.isSafeInteger(quantity) || quantity < 1) {
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

        // Medicine must belong to the authenticated pharmacy.
        const medicine = await Medicine.findOne({
            _id: new Types.ObjectId(medicineId),
            pharmacy: pharmacyId,
            isDeleted: { $ne: true },
        });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found in your pharmacy",
            });
        }

        const purchase = await Purchase.create({
            pharmacy: pharmacyId,
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
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to create purchase order",
        });
    }
};

// RECEIVE PURCHASE
export const receivePurchase = async (
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
                message: "Invalid purchase order ID",
            });
        }

        // Claim only a pending order belonging to this pharmacy.
        const purchase = await Purchase.findOneAndUpdate(
            {
                _id: new Types.ObjectId(id),
                pharmacy: pharmacyId,
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
            // Only check for an existing order within this pharmacy.
            const existing = await Purchase.findOne({
                _id: new Types.ObjectId(id),
                pharmacy: pharmacyId,
            });

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
            // Update stock only if the medicine belongs to this pharmacy.
            const medicineUpdate = await Medicine.updateOne(
                {
                    _id: purchase.medicine,
                    pharmacy: pharmacyId,
                    isDeleted: { $ne: true },
                },
                {
                    $inc: {
                        quantity: purchase.quantity,
                    },
                }
            );

            if (medicineUpdate.matchedCount === 0) {
                throw new Error(
                    "The medicine linked to this order no longer exists in your pharmacy"
                );
            }
        } catch (stockError) {
            // Restore Pending if stock could not be updated.
            await Purchase.updateOne(
                {
                    _id: purchase._id,
                    pharmacy: pharmacyId,
                    status: "Received",
                },
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
