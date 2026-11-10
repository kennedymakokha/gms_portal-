import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import CategoriesModel from '../models/categoriesModel';


import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildCategoryFilter } from './filters/categoryFilters';


export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildCategoryFilter({
      
      search,
    });

    const [categories, total] = await Promise.all([
      CategoriesModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      CategoriesModel.countDocuments(filter),
    ]);

    res.status(200).json({
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching Categories:', error);
    res.status(500).json({ message: error.message });
  }
};

// export const deleteAllCategories = async (req: AuthRequest, res: Response) => {
//   try {
//     await Categories.deleteMany({});
//     res.json({ message: 'All Categories deleted successfully' });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid,
          name,
          description,
          } = req.body;
    const Category = await CategoriesModel.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          description,
          // clinic: req.user?.clinicId,
          isDeleted: req.body.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_by: req.user?.id,
          created_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    res.status(201).json(Category);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

// controllers/DrugController.js

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const cat = await CategoriesModel.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: ' Category updated', cat });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeletecategory = async (req: AuthRequest, res: Response) => {
  try {


    const { id } = req.params; // or uuid — whichever you chose


    const cat = await CategoriesModel.findOneAndDelete({ uuid: id });

    if (!cat) {
      
      return res.status(404).json({ error: 'Category not found' });
    }

   
    res.json({ message: ' Category deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const cat = await CategoriesModel.findOneAndUpdate(
      { uuid: id, isDeleted: false }, // only active Categories
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!cat) {
      return res.status(404).json({
        error: 'Category not found or already deleted',
      });
    }

    res.json({
      message: ' Category soft-deleted',
      Category: cat,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
