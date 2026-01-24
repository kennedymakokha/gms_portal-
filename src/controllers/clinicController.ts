import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

import Clinic from '../models/clinicModel';



export const saveclinic = async (req: AuthRequest, res: Response) => {
  try {

    const {
      name, phone
    } = req.body


    try {
      // 1️⃣ Ensure customer exists
      let ClinicData = await Clinic.findOne({ name: name });
      if (!ClinicData) {
        await Clinic.create([{ name: name, phone: phone, created_by: req?.user?.id }]);

      }
      res.status(201).json({ message: '  card saved successfully' });

    } catch (err) {

      throw err;
    }
  } catch (error: any) {
    console.error(' Error saving  card:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getclinics = async (req: AuthRequest, res: Response) => {
  try {
    const clinics = await Clinic.find({ deletedAt: null, isDeleted: false});
    res.json(clinics);
  } catch (error: any) {
    console.error(' Error fetching clinics:', error);
    res.status(500).json({ message: error.message });
  }
};


export const deleteClinic = async (req: AuthRequest, res: Response) => {
  try {
    const clinix = await Clinic.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!clinix) {
      return res.status(404).json({ message: 'clinic not found' });
    }

    res.json({ message: ' clinic deleted', clinix });
  } catch (error: any) {
    console.error(' Error deleting clinix:', error);
    res.status(500).json({ message: error.message });
  }
};
