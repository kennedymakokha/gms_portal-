import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Patient from '../models/patientModel';
import Visits, { IVisits } from '../models/visitModel';
import Clinic from '../models/clinicModel';
import mongoose from 'mongoose';




// Utility function to generate unified ID
export const generateUnifiedId = (str: string) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${str}_${timestamp}_${random}`;
};

export const createpatient = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { uuid, name, notes, visitDate } = req.body as IVisits & { name?: string };
    // 1️⃣ Find or create patient
    let patient = await Patient.findOne({ $or: [{ uuid }, { name }] }).session(session);

    if (!patient) {
      req.body.created_by = req.user?.id

      patient = new Patient(req.body);
      await patient.save({ session });
    }

    // 2️⃣ Create visit / visit
    // const visitdata = new Visits({
    //   uuid: generateUnifiedId('visit'),
    //   patientuuid: patient.uuid,
    //   notes: notes || '',
    //   visitDate: visitDate ? new Date(visitDate) : new Date(),
    // });

    // await visitdata.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: ' visit saved successfully',
      patient,
      // visitdata,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(' Error saving visit:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getpatients = async (req: AuthRequest, res: Response) => {
  try {

    const patients = await Patient.find({ deletedAt: null, isDeleted: false, clinic: req.user?.clinicId });

    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// export const createpatient = async (req: AuthRequest, res: Response) => {
//   try {
//     const { uuid, name, } = req.body;

//     // check by uuid first, fallback to name
//     const existing = await Patient.findOne({ $or: [{ uuid }, { name }] });
//     if (existing) {
//       return res.status(200).json(existing); // already exists, return it
//     }
//     req.body.created_by = req.user?.id
//     req.body.clinic = req.user?.clinic?._id
//     const dept = new Patient(req.body);

//     await dept.save();
//     res.status(201).json(dept);
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

// controllers/patientController.js



export const updatepatient = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const dept = await Patient.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!dept) return res.status(404).json({ error: 'patient not found' });
    res.json({ message: ' patient updated', dept });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeletepatient = async (req: AuthRequest, res: Response) => {
  try {
    console.log('PARAMS:', req.params);

    const { id } = req.params; // or uuid — whichever you chose
    console.log('DELETE ID:', id);

    const dept = await Patient.findOneAndDelete({ uuid: id });

    if (!dept) {
      console.log(' No patient found for uuid:', id);
      return res.status(404).json({ error: 'patient not found' });
    }

    console.log(' Deleted:', dept.uuid);
    res.json({ message: ' patient deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deletepatient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dept = await Patient.findOneAndUpdate(
      { uuid: id, isDeleted: false }, // only active patients
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!dept) {
      return res.status(404).json({
        error: 'patient not found or already deleted',
      });
    }

    res.json({
      message: ' patient soft-deleted',
      patient: dept,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
