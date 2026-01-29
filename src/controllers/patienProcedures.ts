import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import PatientProcedures from '../models/patientProcedureModal';


export const getPatientProcedures = async (req: AuthRequest, res: Response) => {
  try {
    const depts = await PatientProcedures.find({ deletedAt: null, isDeleted: false, });
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const createPatientProcedures = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.body;

    // check by uuid first, fallback to name
    const existing = await PatientProcedures.findOne({ $or: [{ uuid }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }
    req.body.clinic = req.user?.clinicId;
    req.body.created_by = req.user?.id;
    const dept = new PatientProcedures(req.body);

    let V = await dept.save();
  
    res.status(201).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

