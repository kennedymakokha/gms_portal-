import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Patient from '../models/patientModel';
import Visits from '../models/visitModel';
import Labs from '../models/labModel'
import PatientLab from '../models/patientlabsModal'
import mongoose from 'mongoose';
import { generateUnifiedId } from './patientController';
import { generateSmartAbbreviation, getNextNumber } from '../utils/getNextNumber';
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildPatientFilter } from './filters/patientFilters';
import { buildVisitFilter } from './filters/visitFilters';
import { buildLabFilter } from './filters/labFilters';


export const createVisit = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { uuid, patientMongoose, prescribedTests } = req.body;
    const clinicId = req.user?.clinicId!;
    if (!uuid) {
      return res.status(400).json({ error: "uuid required" });
    }

    // 🔁 Rebuild labs + recalc fee (idempotent)
    if (Array.isArray(prescribedTests)) {
      await PatientLab.deleteMany({ uuid }).session(session);
      const testUUid = await getNextNumber({
        base: "LO",
        clinicId,
        // department: `${generateSmartAbbreviation(departmentName)}/${generateSmartAbbreviation(req.body.status)}`,
        session,
      });


      await PatientLab.insertMany(
        prescribedTests.map((testId: string) => ({
          testId,
          uuid: testUUid,
          patientMongoose,
          patientId: req.body.patientId,
          created_by: req.user?.id,
        })),
        { session }
      );

      const labs = await Labs.find({
        _id: { $in: prescribedTests },
      })
        .select("price")
        .session(session);

      req.body.totallabTestFee = labs.reduce(
        (sum, l) => sum + Number(l.price || 0),
        0
      );
    }

    const ALLOWED_UPDATE_FIELDS = [
      "chiefComplaint",
      "symptoms",
      "prescribedTests",
      "notes",
      "track",
      "totallabTestFee",
      "totalAmount",
      "isDeleted",
      "deletedAt",
      "bp",
      "temperature",
      "pulse",
      "respiratoryRate",
      "oxygenSaturation",
      "labtechId",
      "vitalsNurseId",
      "weight",
      "height",
      "bmi",
    ];

    const updateData: any = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const visit = await Visits.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          patientMongoose,
          patientId: req.body.patientId,
          clinic: req.user?.clinicId,
          created_by: req.user?.id,
        },
        ...(Object.keys(updateData).length && { $set: updateData }),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        session,
      }
    );

    // 🔁 Keep patient in sync
    if (patientMongoose && req.body.track !== undefined) {
      await Patient.findByIdAndUpdate(
        patientMongoose,
        { $set: { track: req.body.track } },
        { session, runValidators: true }
      );
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "Visit saved successfully",
      visit,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);

    res.status(500).json({ error: error.message });
    console.log(error);
  } finally {
    session.endSession();
  }
};


export const getvisit = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const track = parseQueryParam(req.query.track as string);

    const filter = buildVisitFilter({
      clinicId: req.user?.clinicId,
      track,
    });

    const [visits, total] = await Promise.all([
      Visits.find(filter)
        .populate('patientMongoose', 'name uuid')
        .populate('created_by', 'name uuid')
        .populate('vitalsNurseId', 'name uuid')
        .populate('prescribedTests')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Visits.countDocuments(filter),
    ]);

    res.status(200).json({
      data: visits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getLaborders = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const status = parseQueryParam(req.query.status as string);

    const filter = buildLabFilter({
      clinicId: req.user?.clinicId,
      status,
    });

    const [patientsLab, total] = await Promise.all([
      PatientLab.find(filter)
        .select('testId visits created_by createdAt status')
        .populate('testId', 'name uuid')
        .populate('created_by', 'name uuid')
        .populate({
          path: 'visits',
          select: 'patientID assignedDoctor',
          populate: {
            path: 'assignedDoctor',
            select: 'name department',
            populate: {
              path: 'department',
              select: 'name consultationFee',
            },
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      PatientLab.countDocuments(filter),
    ]);

    res.status(200).json({
      data: patientsLab,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching lab orders:', error);
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
