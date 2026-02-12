import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Patient from '../models/patientModel';
import Visits from '../models/visitModel';
import Payments, { PaymentRecord } from '../models/paymentModal'
import { Types } from "mongoose";

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid, patientId, visitId, track } = req.body;

    if (!uuid || !patientId) {
      return res.status(400).json({ error: "uuid & patientId required" });
    }

    const ALLOWED_UPDATE_FIELDS: (keyof PaymentRecord)[] = [
      "consultationFee",
      "labFee",
      "medFee",
      "otherFee",
      "boardingFee",
      "method",
      "consultationFeepaidAt",
      "labFeepaidAt",
      "medFeepaidAt",
      "otherFeepaidAt",
      "boardingFeepaidAt",
      "status",
    ];

    const updateData: Partial<PaymentRecord> = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field]; // ✅ now TS is happy
      }
    }


    // Ensure clinicId and created_by are ObjectId
    const clinicId = req.user?.clinicId
      ? new Types.ObjectId(req.user.clinicId)
      : undefined;
    const createdBy = req.user?.id ? new Types.ObjectId(req.user.id) : undefined;

    // Upsert payment
    const payment = await Payments.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          patientId: new Types.ObjectId(patientId),
          visitId: visitId ? new Types.ObjectId(visitId) : undefined,
          clinic: clinicId,
          created_by: createdBy,
        },
        ...(Object.keys(updateData).length ? { $set: updateData } : {}),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Update patient and visit track if provided
    if (track) {
      await Promise.all([
        Patient.findByIdAndUpdate(patientId, { track }),
        visitId ? Visits.findByIdAndUpdate(visitId, { track }) : null,
      ]);
    }

    res.status(200).json({
      message: "Payment saved successfully",
      payment,
    });
  } catch (error: any) {
    console.error("Create payment error:", error);
    res.status(500).json({ error: error.message });
  }
};




export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    // 1️⃣ Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2️⃣ Extract query parameters
    const search = (req.query.search as string)?.trim();
    const rawStatus = req.query.status as string;
    const rawTrack = req.query.track as string;

    const status =
      rawStatus && rawStatus !== 'undefined' && rawStatus !== 'null'
        ? rawStatus
        : undefined;

    const track =
      rawTrack && rawTrack !== 'undefined' && rawTrack !== 'null'
        ? rawTrack
        : undefined;

    // 3️⃣ Base filter
    const filter: any = {
      clinic: req.user?.clinicId,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    };


    // 5️⃣ Status filter
    if (status) {
      filter.status = status;
    }

    if (track) {
      const billingTracks = ['reg_billing', 'lab_billing', 'med_billing'];

      if (track === 'billing') {
        filter.track = { $in: billingTracks };
      } else {
        filter.track = track;
      }
    }



    const [payments, total] = await Promise.all([
      Payments.find(filter)
        .populate('patientId', 'name uuid track')
        .populate('visitId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payments.countDocuments(filter),
    ]);

    // 8️⃣ Return response
    res.status(200).json({
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: error.message });
  }
};


