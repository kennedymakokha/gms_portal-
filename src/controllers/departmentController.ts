import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Department from '../models/deptModel';
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildDepartmentFilter } from './filters/departmentFilters';
import mongoose from 'mongoose';
import { getNextNumber } from '../utils/getNextNumber';
import Branch from '../models/branchModel'

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildDepartmentFilter({
      branchId: req.user?.branchId,
      search,
    });

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).populate('head', "name")
        .limit(limit)
        .lean(),

      Department.countDocuments(filter),
    ]);

    res.status(200).json({
      data: departments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: error.message });
  }
};

// export const createDepartment = async (req: AuthRequest, res: Response) => {


//   try {
//     const { uuid, name, code, description } = req.body;
//     const dept = await Department.findOneAndUpdate(
//       { uuid },
//       {
//         $set: {
//           name,
//           description,
//           clinic: req.user?.clinicId,
//           isDeleted: req.body.isDeleted ?? false,
//           updated_at: new Date(),
//         },
//         $setOnInsert: {
//           created_by: req.user?.id,
//           created_at: new Date(),
//         },
//       },
//       {
//         upsert: true,
//         new: true,
//       })

//     res.status(201).json(dept);
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };
export const createDepartment = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let { uuid, name, phone, isDeleted = false } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Dept Name is required",
      });
    }

    if (!uuid) {
      uuid = await getNextNumber({
        base: "DPT",
        clinicId: `${req.user?.clinicId}`,
        branchId: `${req.user?.branchId}`,
        session,
      });
    }
    const ALLOWED_UPDATE_FIELDS = [
      "phone",
      "name",
      "description?",
      "fee",
      "patients",
      "staffs",
      "head",
      "isDeleted",
      "deletedAt",
    ];

    const updateData: any = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const branch = await Department.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          created_by: req.user?.id,
          branch: `${req.user?.branchId}`,
        },
        ...(Object.keys(updateData).length && { $set: updateData }),
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
        session,

      }
    );
    await Branch.findByIdAndUpdate(
      req.user?.branchId,
      { $addToSet: { departments: branch._id } },
      { session }
    );
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "branch saved successfully",
      branch,
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error saving clinic:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const dept = await Department.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: ' Department updated', dept });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeleteDepartment = async (req: AuthRequest, res: Response) => {
  try {


    const { id } = req.params; // or uuid — whichever you chose


    const dept = await Department.findOneAndDelete({ uuid: id });

    if (!dept) {

      return res.status(404).json({ error: 'Department not found' });
    }

    console.log(' Deleted:', dept.uuid);
    res.json({ message: ' Department deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dept = await Department.findOneAndUpdate(
      { uuid: id, isDeleted: false }, // only active departments
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!dept) {
      return res.status(404).json({
        error: 'Department not found or already deleted',
      });
    }

    res.json({
      message: ' Department soft-deleted',
      department: dept,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
