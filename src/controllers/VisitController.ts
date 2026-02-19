import { Request, Response } from 'express';
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
import Payment, { PaymentRecord } from '../models/paymentModal';
import User from '../models/userModel';



interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "card" | "insurance" | "mobile";
  paidAt?: string;
}

interface InvoiceItem {
  description: string;
  category: "consultation" | "lab-test" | "procedure" | "medication" | "bed" | "other";
  quantity: number;
  unitPrice: number;
  total: number;
}
export const createVisit = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { uuid, patientMongoose, prescribedTests, orderedBy
    } = req.body;
    const clinicId = req.user?.clinicId!;
    if (!uuid) {
      return res.status(400).json({ error: "uuid required" });
    }
    let assignedDoctor = orderedBy?._id

    const doctor = await User.findById(assignedDoctor)
      .populate({ path: "department", select: "fee name" })
      .session(session);

    const departmentName =
      (doctor?.department as any)?.name || undefined;
    // 🔁 Rebuild labs + recalc fee (idempotent)
    if (Array.isArray(prescribedTests)) {
      await PatientLab.deleteMany({ visitUuid: uuid }).session(session);

      const testUUid = await getNextNumber({
        base: "LO",
        clinicId,
        department: `${generateSmartAbbreviation(departmentName)}`,
        session,
      });


      // await PatientLab.insertMany(
      //   prescribedTests.map((testId: string) => ({
      //     testId,
      //     uuid: testUUid,
      //     clinic: clinicId,
      //     patientMongoose,
      //     patientId: req.body.patientId,
      //     created_by: req.user?.id,
      //   })),
      //   { session }
      // );
      
      await PatientLab.insertMany(
        prescribedTests.map((testId: string, index: number) => ({
          testId,
          uuid: `${testUUid}/${index + 1}`,  // start from 1
          visitId: req.body.visitId,
          clinic: clinicId,
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
      "track",
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
      let p: any = await Patient.findByIdAndUpdate(
        patientMongoose,
        { $set: { track: req.body.track } },
        { session, runValidators: true }
      );
      await Payment.findOneAndUpdate(
        { visitId: p?.visits[0]?._id },
        { $set: { track: req.body.track } },
        { session, runValidators: true }
      );

    }
    if (req.body.status !== undefined) {
      const payment = await Payment.findOneAndUpdate(
        { visitId: req.body.visitId },  // ✅ use visitId
        { $set: { status: req.body.status } },
        { session, new: true }
      );

      if (!payment) {
        console.log("⚠️ No payment found for visitId:", req.body.visitId);
      }
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



export const getvisits = async (req: AuthRequest, res: Response) => {
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
        .select('testId visits uuid created_by priority createdAt status')
        .populate('testId')
        .populate('created_by', 'name uuid')
        .populate({
          path: 'visitId',
          select: 'patientID assignedDoctor patientMongoose',
          populate: [
            {
              path: 'assignedDoctor',
              select: 'name department',
              populate: {
                path: 'department',
                select: 'name consultationFee',
              },
            },
            {
              path: 'patientMongoose',
              select: 'name',
            },
          ],
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


/**
 * Updates the status of lab tests for a visit.
 * Once all tests are updated, updates Visit & Payment track to 'post-lab'.
 */


/**
 * Update a single lab test result/status.
 * Once all tests for the visit are completed, set Visit & Payment track to 'post-lab'.
 */
export const updateSingleLabTestStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
 
  try {
    session.startTransaction();

    const { visitId, testUuid, status, result } = req.body;
    if (!visitId || !testUuid || !status) {
      return res.status(400).json({ error: "visitId, testUuid and status are required" });
    }

    // 1️⃣ Update the specific test
    const labTest = await PatientLab.findOneAndUpdate(
      { uuid: testUuid, visitId },
      { $set: { status, result } },
      { session, new: true }
    );

    if (!labTest) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Lab test not found" });
    }

    // 2️⃣ Check if any remaining tests are still pending or in-progress
    const remaining = await PatientLab.countDocuments({
      visitId,
      status: { $nin: ["completed"] },
    }).session(session);

    // 3️⃣ If no remaining tests, update Visit & Payment track
    if (remaining === 0) {
     let visit = await Visits.findOneAndUpdate(
        { _id: visitId },
        { $set: { track: "post-lab" } },
        { session, new: true }
      );

      await Payment.updateMany(
        { visitId },
        { $set: { track: "post-lab" } },
        { session }
      );
      await Patient.findOneAndUpdate(
        { _id:visit?.patientMongoose },
        { $set: { track: "post-lab" } },
        { session }
      );
      console.log(visit);
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "Lab test updated successfully",
      labTest,
      allTestsCompleted: remaining === 0,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};


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
