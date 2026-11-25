
import { Response } from "express";
import { Types } from "mongoose";

import { AuthRequest } from "../middleware/auth";
import Inventory from "../models/inventoryModel";
import { getPagination } from "../utils/pagination";
import { parseQueryParam } from "../utils/queryParser";
import { buildInventoryFilter } from "./filters/inventoryFilters";

const getPharmacyId = (req: AuthRequest): Types.ObjectId | null => {
    const pharmacyId = req.user?.pharmacyId;

    if (!pharmacyId || !Types.ObjectId.isValid(pharmacyId)) {
        return null;
    }

    return new Types.ObjectId(pharmacyId);
};

// GET INVENTORY
export const getInventory = async (
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

        const { page, limit, skip } = getPagination(
            req.query.page as string,
            req.query.limit as string
        );

        const search = parseQueryParam(req.query.search as string);

        // Preserve existing search filters and enforce pharmacy ownership.
        const filter = {
            ...buildInventoryFilter({ search }),
            pharmacy: pharmacyId,
        };

        const [items, total] = await Promise.all([
            Inventory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Inventory.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching inventory:", error);

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch inventory",
        });
    }
};

// CREATE INVENTORY ITEM
export const createItem = async (
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

        // Always assign pharmacy from the authenticated user.
        // Never trust a pharmacy ID supplied by the frontend.
        const item = new Inventory({
            ...req.body,
            pharmacy: pharmacyId,
        });

        await item.save();

        return res.status(201).json({
            success: true,
            message: "Inventory item created successfully",
            data: item,
        });
    } catch (error) {
        console.error("Create inventory item error:", error);

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to create inventory item",
        });
    }
};
