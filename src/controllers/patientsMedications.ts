import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Medications from '../models/patientmedicationsModel';


export const getMedications = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await Medications.find({ deletedAt: null, isDeleted: false, });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const createMedications = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, uuid, clinic, stock } = req.body;

    // check by uuid first, fallback to name
    const existing = await Medications.findOne({ $or: [{ uuid }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }
    req.body.clinic = req.user?.clinicId;
    req.body.created_by = req.user?.id;
    const dept = new Medications(req.body);

    let V = await dept.save();
    console.log("DRUG after", V)
    res.status(201).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

