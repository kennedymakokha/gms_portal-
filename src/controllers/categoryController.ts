
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";

import CategoriesModel from "../models/categoriesModel";
import { getPagination } from "../utils/pagination";
import { parseQueryParam } from "../utils/queryParser";
import { buildCategoryFilter } from "./filters/categoryFilters";

// Ensure every category operation is restricted to the authenticated pharmacy.
const getPharmacyId = (req: AuthRequest, res: Response): string | null => {
  const pharmacyId = req.user?.pharmacyId;

  if (!pharmacyId) {
    res.status(403).json({
      message: "Your account is not assigned to a pharmacy",
    });

    return null;
  }

  return pharmacyId;
};

// GET CATEGORIES
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = {
      ...buildCategoryFilter({ search }),
      pharmacy: pharmacyId,
      isDeleted: false,
    };

    const [categories, total] = await Promise.all([
      CategoriesModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      CategoriesModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching Categories:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// CREATE CATEGORY
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { uuid, name, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    let categoryUuid = uuid;

    if (!categoryUuid) {
      categoryUuid = `CAT-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
    }

    const category = await CategoriesModel.findOneAndUpdate(
      {
        pharmacy: pharmacyId,
        uuid: categoryUuid,
      },
      {
        $set: {
          name: name.trim(),
          description: description || "",
          isDeleted: false,
          deletedAt: null,
          updated_at: new Date(),
        },
        $setOnInsert: {
          pharmacy: pharmacyId,
          uuid: categoryUuid,
          created_by: req.user?.id,
          created_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(201).json(category);
  } catch (error: any) {
    console.error("Error creating category:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A category with this name or identifier already exists",
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { uuid } = req.params;
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const cat = await CategoriesModel.findOneAndUpdate(
      {
        uuid,
        pharmacy: pharmacyId,
        isDeleted: false,
      },
      {
        $set: {
          name: name.trim(),
          ...(description !== undefined ? { description } : {}),
          updated_at: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!cat) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json({
      message: "Category updated",
      cat,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A category with this name already exists",
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
};

// HARD DELETE CATEGORY
export const harddeletecategory = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { id } = req.params;

    const cat = await CategoriesModel.findOneAndDelete({
      uuid: id,
      pharmacy: pharmacyId,
    });

    if (!cat) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json({
      message: "Category permanently deleted",
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// SOFT DELETE CATEGORY
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const pharmacyId = getPharmacyId(req, res);
    if (!pharmacyId) return;

    const { uuid } = req.params;

    const cat = await CategoriesModel.findOneAndUpdate(
      {
        uuid,
        pharmacy: pharmacyId,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updated_at: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!cat) {
      return res.status(404).json({
        message: "Category not found or already deleted",
      });
    }

    return res.json({
      message: "Category soft-deleted",
      category: cat,
    });
  } catch (error: any) {
    console.error("Error soft-deleting category:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
