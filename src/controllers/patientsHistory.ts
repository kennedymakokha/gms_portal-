import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import History from '../models/patientHistoryModel';


export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await History.find({ deletedAt: null, isDeleted: false, });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const createHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.body;

    // check by uuid first, fallback to name
    const existing = await History.findOne({ $or: [{ uuid }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }
    req.body.clinic = req.user?.clinicId;
    req.body.created_by = req.user?.id;
    const detail = new History(req.body);

    let V = await detail.save();

    res.status(201).json(detail);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

