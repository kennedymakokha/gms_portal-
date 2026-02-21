import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Patient from '../models/patientModel';
import Visits from '../models/visitModel';
import Payments, { PaymentRecord } from '../models/paymentModal'
import { Types } from "mongoose";




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
      "track",
    ];

    const updateData: Partial<PaymentRecord> = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field]; // ✅ now TS is happy
      }
    }


    // Ensure clinicId and created_by are ObjectId
  
    const createdBy = req.user?.id ? new Types.ObjectId(req.user.id) : undefined;

    // Upsert payment
    const payment = await Payments.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          patientId: new Types.ObjectId(patientId),
          visitId: visitId ? new Types.ObjectId(visitId) : undefined,
          branch: `${req.user?.branchId}`,
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
      branch: req.user?.branchId,
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
        .populate({
          path: 'visitId',
          select: 'patientID assignedDoctor prescribedTests',
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
              path: 'prescribedTests',
              select: 'testName price',
            }
          ]
        })
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
    res.status(500).json({ message: error.message });
  }
};


export const getmonthlysum = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const branchId = req.user?.branchId;

    if (!branchId) {
      return res.status(400).json({ message: "branch ID missing" });
    }

    const branchObjectId = new Types.ObjectId(branchId);

    const result = await Payments.aggregate([
      {
        $match: {
          branch: branchObjectId
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: {
            $sum: {
              $add: [
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$consultationFeepaidAt", null] },
                        { $gte: ["$consultationFeepaidAt", start] },
                        { $lte: ["$consultationFeepaidAt", end] }
                      ]
                    },
                    "$consultationFee",
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$labFeepaidAt", null] },
                        { $gte: ["$labFeepaidAt", start] },
                        { $lte: ["$labFeepaidAt", end] }
                      ]
                    },
                    "$labFee",
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$medFeepaidAt", null] },
                        { $gte: ["$medFeepaidAt", start] },
                        { $lte: ["$medFeepaidAt", end] }
                      ]
                    },
                    "$medFee",
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$otherFeepaidAt", null] },
                        { $gte: ["$otherFeepaidAt", start] },
                        { $lte: ["$otherFeepaidAt", end] }
                      ]
                    },
                    "$otherFee",
                    0
                  ]
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$boardingFeepaidAt", null] },
                        { $gte: ["$boardingFeepaidAt", start] },
                        { $lte: ["$boardingFeepaidAt", end] }
                      ]
                    },
                    "$boardingFee",
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      total: result[0]?.totalPaid || 0
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate monthly sum"
    });
  }
};



