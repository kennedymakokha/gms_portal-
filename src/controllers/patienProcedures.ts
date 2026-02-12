import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import PatientProcedures from '../models/patientProcedureModal';

import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildPatientProcedureFilter } from './filters/patientProcedureFilters';


export const getPatientProcedures = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);
    const status = parseQueryParam(req.query.status as string);

    const filter = buildPatientProcedureFilter({
      clinicId: req.user?.clinicId,
      search,
      status,
    });

    const [procedures, total] = await Promise.all([
      PatientProcedures.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      PatientProcedures.countDocuments(filter),
    ]);

    res.status(200).json({
      data: procedures,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching patient procedures:', error);
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

