import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AppointmentModel from '../models/appointmentsModel';

import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildAppointmentsFilter } from './filters/appointmentsFilters';
import { sendTextMessage } from '../utils/smsSender';
import patientModel from '../models/patientModel';
import Clinic from '../models/clinicModel'
export const getAppoinments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildAppointmentsFilter({
      clinicId: req.user.clinicId,
      role: req.user.role,
      userId:req.user?.id,
      search,
    });

    const [Appoinments, total] = await Promise.all([
      AppointmentModel.find(filter)
        .populate('patientId', "name")
        .populate('doctorId', "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AppointmentModel.countDocuments(filter),
    ]);

    res.status(200).json({
      data: Appoinments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching Appoinments:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getAppoinmentOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;

    const statusFilter =
      req.user?.role === "admin"
        ? { $in: ['available', 'occupied', 'maintenance', 'reserved'] }
        : { $in: ['available', 'reserved'] };

    const result = await AppointmentModel.find({
      clinic: clinicId,
      status: statusFilter,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    }).select("uuid");

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



export const createAppoinment = async (req: AuthRequest, res: Response) => {
  try {

    const { uuid, patientId, time, date, patientName, doctorId, doctorName, type, notes, status, reason } = req.body;

    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }
    let patient = await patientModel.findById(patientId)
    let clinic = await Clinic.findById(req.user?.clinicId)
    const Appoinment = await AppointmentModel.findOneAndUpdate(
      { uuid },
      {
        $set: {
          uuid,
          patientId,
          patientName,
          doctorId,
          doctorName,
          date,
          time,
          type,
          status,
          notes,
          clinic: req.user?.clinicId,
          isDeleted: req.body.isDeleted ?? false,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_by: req.user?.id,
          created_at: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    let mode = ""
    let Note
    if (status === "cancelled") {
      mode = "appontment-cancellation"
      Note = `Hi ${patient?.name} \nYour appointment  scheduled on ${Appoinment.date} at ${Appoinment.time}  has been cancelled  due to ${reason}`

      await sendTextMessage(
        `${Note}`,
        `${patient?.phone}`,
        `${patient?._id}`,
        `${mode}`
      )

    }


    res.status(201).json(Appoinment);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



// controllers/DrugController.js


