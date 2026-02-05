import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Department from '../models/deptModel';

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await Department.find({ deletedAt: null, isDeleted: false, clinic: req.user?.clinicId });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid, name, code, description } = req.body;
    const dept = await Department.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          description,
          clinic: req.user?.clinicId,
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
      })

    res.status(201).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// controllers/departmentController.js

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
