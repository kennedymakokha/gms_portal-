import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Department from '../models/deptModel';

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await Department.find({ deletedAt: null, isDeleted: false });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid, name, code, description } = req.body;

    // check by uuid first, fallback to name
    const existing = await Department.findOne({ $or: [{ uuid }, { name }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }

    const dept = new Department({
      uuid,
      name,
      description,
      created_by: req.user?.id
    });

    await dept.save();
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
