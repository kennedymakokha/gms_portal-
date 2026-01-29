import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

import Visits, { IVisits } from '../models/visitModel';




export const createVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({ error: 'uuid is required' });
    }

    const payload = {
      ...req.body,
      clinic: req.user?.clinicId,
      created_by: req.user?.id,
    };

    const visit = await Visits.findOneAndUpdate(
      { uuid },                 // 🔑 idempotency key
      { $setOnInsert: payload },// only insert once
      {
        upsert: true,
        new: true,              // return existing or inserted doc
      }
    );

    res.status(201).json({
      message: 'Visit saved successfully',
      visit,
    });
  } catch (error: any) {
    console.error('Error saving visit:', error);
    res.status(500).json({ error: error.message });
  }
};



// ----------------------
// Get Jobs
// ----------------------
export const getvisits = async (req: AuthRequest, res: Response) => {
  try {

    const visits = await Visits.find({   clinic: req.user?.clinicId });


    res.json(visits);
  } catch (error: any) {
    console.error(' Error fetching visits:', error);
    res.status(500).json({ message: error.message });
  }
};

// ----------------------
// Create visit
// ----------------------

export const deletevisit = async (req: AuthRequest, res: Response) => {
  try {
    const visit = await Visits.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ message: 'visit not found' });
    }

    res.json({ message: ' visit deleted', visit });
  } catch (error: any) {
    console.error(' Error deleting visit:', error);
    res.status(500).json({ message: error.message });
  }
};
