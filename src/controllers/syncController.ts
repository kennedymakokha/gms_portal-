import { Response } from 'express';
import mongoose, { Model } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Job from '../models/jobModel';
import Inventory from '../models/inventoryModel';
import Department from '../models/deptModel';

async function getChanges<T>(model: Model<T>, lastSync: Date | null) {
  const query = lastSync ? { updatedAt: { $gt: lastSync } } : {};
  return model.find(query).lean();
}

export const pullChanges = async (req: AuthRequest, res: Response) => {
  try {
    const lastSyncStr = req.query.lastSync as string;
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

    const [jobs, inventory, departments] = await Promise.all([
      getChanges(Job, lastSync),
      getChanges(Inventory, lastSync),
      getChanges(Department, lastSync)
    ]);

    res.json({
      timestamp: new Date(),
      changes: { jobs, inventory, departments }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const pushChanges = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { changes } = req.body;
    
    if (changes.jobs && Array.isArray(changes.jobs)) {
      for (const job of changes.jobs) {
        if (job._tempId) { 
            const { _id, _tempId, ...data } = job;
            await Job.create([data], { session });
        } else { 
            await Job.findByIdAndUpdate(job._id, { ...job, updatedAt: new Date() }, { session, upsert: true });
        }
      }
    }

    if (changes.inventory && Array.isArray(changes.inventory)) {
      for (const item of changes.inventory) {
         if (item._tempId) {
            const { _id, _tempId, ...data } = item;
            await Inventory.create([data], { session });
        } else {
            await Inventory.findByIdAndUpdate(item._id, { ...item, updatedAt: new Date() }, { session, upsert: true });
        }
      }
    }

    await session.commitTransaction();
    res.json({ message: 'Sync successful', timestamp: new Date() });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Sync failed', error: error.message });
  } finally {
    session.endSession();
  }
};