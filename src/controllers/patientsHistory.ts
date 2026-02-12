import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import History from '../models/patientHistoryModel';


import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildHistoryFilter } from './filters/historyFilters';


export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);
    const status = parseQueryParam(req.query.status as string);

    const filter = buildHistoryFilter({
      clinicId: req.user?.clinicId,
      search,
      status,
    });

    const [history, total] = await Promise.all([
      History.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      History.countDocuments(filter),
    ]);

    res.status(200).json({
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: error.message });
  }
};


export const createHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.body;

    // check by uuid first, fallback to name
    const existing = await History.findOne({ $or: [{ uuid }] });
    if (existing) {
      return res.status(200).json(existing); // already exists, return it
    }
    req.body.clinic = req.user?.clinicId;
    req.body.created_by = req.user?.id;
    const detail = new History(req.body);

    let V = await detail.save();

    res.status(201).json(detail);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

