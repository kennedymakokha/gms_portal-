
import { Request, Response } from "express";
import { Types } from "mongoose";

import Sale from "../models/salesModel";
import Medicine from "../models/medicineModel";
import Customer from "../models/customerModel";
type RequestedItem = {
    medicine: string;
    quantity: number;
};

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const makeReference = () =>
    `SALE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const getSales = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const [sales, total] = await Promise.all([
            Sale.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("items.medicine", "name batch"),
            Sale.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            data: sales,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get sales error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sales.",
        });
    }
};

export const getSaleById = async (req: Request, res: Response) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sale ID.",
            });
        }

        const sale = await Sale.findById(req.params.id).populate(
            "items.medicine",
            "name batch"
        );

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found.",
            });
        }

        return res.status(200).json({ success: true, data: sale });
    } catch (error) {
        console.error("Get sale error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sale.",
        });
    }
};

export const createSale = async (req: Request, res: Response) => {
    const deductedStock: Array<{ id: Types.ObjectId; quantity: number }> = [];

    try {
        const rawItems = req.body?.items as RequestedItem[];
        const customerId = req.body.customer
            ? String(req.body.customer).trim()
            : "";

        let selectedCustomer = null;

        if (customerId) {
            if (!Types.ObjectId.isValid(customerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid customer ID",
                });
            }

            selectedCustomer = await Customer.findOne({
                _id: customerId,
                isDeleted: { $ne: true },
            });

            if (!selectedCustomer) {
                return res.status(404).json({
                    success: false,
                    message: "Selected customer was not found",
                });
            }
        }
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Add at least one medicine to the sale.",
            });
        }

        const paymentMethod = String(req.body?.paymentMethod || "").toLowerCase();

        if (!["cash", "mpesa", "card"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Select a valid payment method.",
            });
        }

        // Combine duplicate medicine entries before checking stock.
        const quantities = new Map<string, number>();

        for (const item of rawItems) {
            const medicineId = String(item?.medicine || "").trim();
            const quantity = Number(item?.quantity);

            if (!isValidObjectId(medicineId)) {
                return res.status(400).json({
                    success: false,
                    message: "A sale contains an invalid medicine.",
                });
            }

            if (!Number.isSafeInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Each quantity must be a positive whole number.",
                });
            }

            quantities.set(
                medicineId,
                (quantities.get(medicineId) || 0) + quantity
            );
        }

        const items: Array<{
            medicine: Types.ObjectId;
            medicineName: string;
            batch: string;
            quantity: number;
            unitPrice: number;
            subtotal: number;
        }> = [];

        let totalAmount = 0;

        for (const [medicineId, quantity] of quantities.entries()) {
            const medicine = await Medicine.findOne({
                _id: medicineId,
                isDeleted: { $ne: true },
            });

            if (!medicine) {
                return res.status(404).json({
                    success: false,
                    message: `Medicine ${medicineId} was not found.`,
                });
            }

            if (medicine.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}.`,
                });
            }

            const unitPrice = Number(medicine.price);

            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid price configured for ${medicine.name}.`,
                });
            }

            const subtotal = unitPrice * quantity;
            totalAmount += subtotal;

            items.push({
                medicine: medicine._id as Types.ObjectId,
                medicineName: medicine.name,
                batch: medicine.batch || "",
                quantity,
                unitPrice,
                subtotal,
            });
        }

        const amountPaid =
            req.body?.amountPaid === undefined
                ? totalAmount
                : Number(req.body.amountPaid);

        if (!Number.isFinite(amountPaid) || amountPaid < totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Amount paid must be at least the total payable.",
            });
        }

        // Conditionally decrement stock to prevent selling more than is available.
        for (const item of items) {
            const result = await Medicine.updateOne(
                {
                    _id: item.medicine,
                    isDeleted: { $ne: true },
                    quantity: { $gte: item.quantity },
                },
                { $inc: { quantity: -item.quantity } }
            );

            if (result.modifiedCount !== 1) {
                throw new Error(
                    `Stock changed while processing ${item.medicineName}. Please retry the sale.`
                );
            }

            deductedStock.push({
                id: item.medicine,
                quantity: item.quantity,
            });
        }

        const sale = await Sale.create({
            reference: makeReference(),
            items,
            customer: selectedCustomer?._id || null,
            customerName: selectedCustomer?.name || "Walk-in Customer",
            paymentMethod,
            totalAmount,
            amountPaid,
            change: amountPaid - totalAmount,
            status: "completed",
        });
        if (selectedCustomer) {
            try {
                await Customer.updateOne(
                    { _id: selectedCustomer._id },
                    { $inc: { visits: 1 } }
                );
            } catch (visitError) {
                console.error("Failed to update customer visits:", visitError);
            }
        }
        return res.status(201).json({
            success: true,
            message: "Sale completed successfully.",
            data: sale,
        });
    } catch (error) {
        // Restore any stock already deducted if the sale could not be saved.
        if (deductedStock.length) {
            await Promise.all(
                deductedStock.map(({ id, quantity }) =>
                    Medicine.updateOne(
                        { _id: id },
                        { $inc: { quantity } }
                    )
                )
            );
        }

        console.error("Create sale error:", error);

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error ? error.message : "Failed to complete sale.",
        });
    }
};
