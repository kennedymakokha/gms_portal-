import mongoose from 'mongoose';
import { Response } from 'express';
import Labs, { ILab } from '../models/labModel';
import { AuthRequest } from '../middleware/auth';

export const getLabs = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.clinicId) {
            return res.status(400).json({ message: 'Clinic ID missing in token' });
        }

        const labs = await Labs.find({
            deletedAt: null,
            isDeleted: false,
            // clinic: new mongoose.Types.ObjectId(req.user.clinicId),
        });

        res.json(labs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};



export const createlab = async (req: AuthRequest, res: Response) => {
    try {
        const { testName, uuid } = req.body;
        // check by uuid first, fallback to name
        const existing = await Labs.findOne({ $or: [{ uuid }, { testName }] });
        if (existing) {
            return res.status(200).json(existing); // already exists, return it
        }

        req.body.created_by = req.user?.id;
        const dept = new Labs(req.body);
        let lab = await dept.save();
        res.status(201).json(dept);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// controllers/labController.js

export const updatelab = async (req: AuthRequest, res: Response) => {
    try {
        const { uuid } = req.params;
        const { name } = req.body;
        const dept = await Labs.findOneAndUpdate({ uuid }, { name }, { new: true });
        if (!dept) return res.status(404).json({ error: 'lab not found' });
        res.json({ message: ' lab updated', dept });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE
export const harddeletelab = async (req: AuthRequest, res: Response) => {
    try {
        console.log('PARAMS:', req.params);

        const { id } = req.params; // or uuid — whichever you chose
        console.log('DELETE ID:', id);

        const dept = await Labs.findOneAndDelete({ uuid: id });

        if (!dept) {
            console.log(' No lab found for uuid:', id);
            return res.status(404).json({ error: 'lab not found' });
        }

        console.log(' Deleted:', dept.uuid);
        res.json({ message: ' lab deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
// soft Delete
export const deletelab = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const dept = await Labs.findOneAndUpdate(
            { uuid: id, isDeleted: false }, // only active Labs
            {
                isDeleted: true,
                deletedAt: new Date(),
            },
            { new: true }
        );

        if (!dept) {
            return res.status(404).json({
                error: 'lab not found or already deleted',
            });
        }

        res.json({
            message: ' lab soft-deleted',
            lab: dept,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
