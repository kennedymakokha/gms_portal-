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
    const {
      uuid,
      name,
      dob,
      sex,
      phone,
      nationalId,
      nokName,
      nokRelationship,
      nokPhone,
      history,
      isDeleted = false,
    } = req.body;

    if (!uuid) {
      return res.status(400).json({ message: 'Patient uuid is required' });
    }

    if (!name || !dob || !sex) {
      return res.status(400).json({
        message: 'name, dob and sex are required',
      });
    }

    const update = {
      $set: {
        name,
        dob,
        sex,
        phone,
        nationalId,
        nokName,
        nokRelationship,
        nokPhone,
        history,
        isDeleted,
        clinic: req.user?.clinicId,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        uuid,
        created_by: req.user?.id,
        createdAt: new Date(),
      },
    };

    const patient = await Patient.findOneAndUpdate(
      { uuid },          // 🔑 idempotency key
      update,
      {
        upsert: true,
        new: true,
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: isDeleted ? 'Patient deleted' : 'Patient saved',
      patient,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error saving patient:', error);
    res.status(500).json({ error: error.message });
  }
};



export const getpatients = async (req: AuthRequest, res: Response) => {
  try {
    const patients = await Patient.find({
      clinic: req.user?.clinicId,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    });

    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};




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


    const { id } = req.params; // or uuid — whichever you chose


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
