import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Patient from '../models/patientModel';
import Visits, { IVisits } from '../models/visitModel';
import Payment, { PaymentRecord } from '../models/paymentModal';
import mongoose, { HydratedDocument } from 'mongoose';
import User from '../models/userModel';
import { getNextNumber, generateSmartAbbreviation } from '../utils/getNextNumber';
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildPatientFilter } from './filters/patientFilters';




// Utility function to generate unified ID
export const generateUnifiedId = (str: string) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${str}_${timestamp}_${random}`;
};

export const createPatient = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const clinicId = req.user?.clinicId!;
    const userId = req.user?.id!;

    let {
      uuid,
      name,
      dob,
      sex,
      phone,
      nationalId,
      nokName,
      bloodgroup,
      room,
      status,
      nokRelationship,
      assignedDoctor,
      nokPhone,
      history,
      address,
      admissionDate,
      isDeleted = false,
    } = req.body;

    if (!name || !dob || !sex) {
      return res.status(400).json({
        message: "name, dob and sex are required",
      });
    }

    // ✅ Generate Patient UUID safely
    if (!uuid) {
      uuid = await getNextNumber({
        base: "ptnt",
        clinicId,
        session,
      });
    }

    // ✅ Upsert Patient
    const patient = await Patient.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          dob,
          sex,
          phone,
          bloodgroup,
          room,
          status,
          nationalId,
          nokName,
          nokRelationship,
          assignedDoctor,
          nokPhone,
          history,
          isDeleted,
          address,
          admissionDate,
          clinic: clinicId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          uuid,
          created_by: userId,
          createdAt: new Date(),
          visits: [],
        },
      },
      {
        upsert: true,
        new: true,
        session,
      }
    );

    // ✅ Only create visit if new patient
    if (patient.visits?.length === 0 && !isDeleted) {

      const doctor = await User.findById(assignedDoctor)
        .populate({ path: "department", select: "fee name" })
        .session(session);

      const departmentName =
        (doctor?.department as any)?.name || undefined;

      const consultationFee =
        (doctor?.department as any)?.fee || 0;

      // ✅ Visit UUID
      const visitUuid =
        await getNextNumber({
          base: "vst",
          clinicId,
          department: `${generateSmartAbbreviation(departmentName)}`,
          session,
        });



      const visit = await new Visits({
        uuid: visitUuid,
        patientId: patient.uuid,
        patientMongoose: patient._id,
        assignedDoctor,
        clinic: clinicId,
        created_by: userId,
        track: "reg_billing",
      }).save({ session });

      // ✅ Payment UUID
      const paymentUuid = await getNextNumber({
        base: "Invoice",
        clinicId,
        department: `${generateSmartAbbreviation(departmentName)}/${generateSmartAbbreviation(req.body.status)}`,
        session,
      });

      await new Payment({
        uuid: paymentUuid,
        patientId: patient._id,
        clinic: clinicId,
        consultationFee,
        created_by: userId,
        visitId: visit._id,
      }).save({ session });

      await Patient.findByIdAndUpdate(
        patient._id,
        { $push: { visits: visit._id } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: isDeleted ? "Patient deleted" : "Patient saved",
      patient,
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error saving patient:", error);
    return res.status(500).json({ error: error.message });
  }
};


export const getpatients = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);
    const status = parseQueryParam(req.query.status as string);
    const track = parseQueryParam(req.query.track as string);

    const filter = buildPatientFilter({
      clinicId: req.user?.clinicId,
      search,
      status,
      track,
    });

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'visits',
          select: 'patientID assignedDoctor uuid patientMongoose ',
          populate: {
            path: 'assignedDoctor',
            select: 'name department uuid',
            populate: {
              path: 'department',
              select: 'name fee uuid',
            },
          },
        })
        .lean(), // 🚀 performance boost

      Patient.countDocuments(filter),
    ]);

    res.status(200).json({
      data: patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: error.message });
  }
};



export const getPatientsOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;

    const result = await Patient.find({
      clinic: clinicId,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    }).select('name status assignedDoctor uuid')



    res.json({ patients: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
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
