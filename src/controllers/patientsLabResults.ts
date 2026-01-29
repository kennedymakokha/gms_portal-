import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import LabResults from '../models/patientLabResultsModel';


export const getLabResults = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await LabResults.find({ deletedAt: null, isDeleted: false, });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const createLabResults = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.body;

    const existing = await LabResults.findOne({ $or: [{ uuid }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }
    req.body.clinic = req.user?.clinicId;
    req.body.created_by = req.user?.id;
    const dept = new LabResults(req.body);
    let V = await dept.save();
    console.log("Lab saved ", req.body)
    res.status(201).json(dept);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

