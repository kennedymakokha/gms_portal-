import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Procedures from '../models/ProcedureModel';

import { Types } from "mongoose";

export const getProcedures = async (req: AuthRequest, res: Response) => {
  try {

    const procedures = await Procedures.find({ deletedAt: null, isDeleted: false, clinic: req.user?.clinicId });
    res.json(procedures);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const createProcedure = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid, description, cost, procedureName } = req.body;
    const drug = await Procedures.findOneAndUpdate(
      { uuid },
      {
        $set: {
          procedureName,
          cost,
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
    res.status(201).json(drug);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

// controllers/DrugController.js

export const updateProcedure = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const dept = await Procedures.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!dept) return res.status(404).json({ error: 'Procedurenot found' });
    res.json({ message: ' Procedureupdated', dept });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeleteProcedure = async (req: AuthRequest, res: Response) => {
  try {


    const { id } = req.params; // or uuid — whichever you chose


    const dept = await Procedures.findOneAndDelete({ uuid: id });

    if (!dept) {
      console.log(' No Procedurefound for uuid:', id);
      return res.status(404).json({ error: 'Procedurenot found' });
    }

    console.log(' Deleted:', dept.uuid);
    res.json({ message: ' Proceduredeleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deleteProcedure = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dept = await Procedures.findOneAndUpdate(
      { uuid: id, isDeleted: false }, // only active Procedures
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!dept) {
      return res.status(404).json({
        error: 'Procedurenot found or already deleted',
      });
    }

    res.json({
      message: ' Proceduresoft-deleted',
      Drug: dept,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
