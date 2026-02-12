import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Procedures from '../models/ProcedureModel';

import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildProcedureFilter } from './filters/procedureFilters';


export const getProcedures = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: "Clinic ID missing in token" });
    }

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);
    const status = parseQueryParam(req.query.status as string);

    const filter = buildProcedureFilter({
      clinicId: req.user.clinicId,
      role: req.user.role,
      search,
      status,
    });

    const [procedures, total] = await Promise.all([
      Procedures.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Procedures.countDocuments(filter),
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
    console.error("Error fetching procedures:", error);
    res.status(500).json({ message: error.message });
  }
};



export const createProcedure = async (req: AuthRequest, res: Response) => {
  try {

    const { uuid, description, category,
      requiresAnesthesia,
      duration,
      status, price, procedureName } = req.body;
    const drug = await Procedures.findOneAndUpdate(
      { uuid },
      {
        $set: {
          procedureName,
          price,
          description,
          category,
          requiresAnesthesia,
          duration,
          status,
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

export const getProcedureOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;
 const statusFilter =
      req.user?.role === "admin"
        ? { $in: ["active", "inactive"] }
        : "active";

    const result = await Procedures.find({
      clinic: clinicId,
      deletedAt: null,
      status:statusFilter,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    }).select('procedureName status  uuid')



    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
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

