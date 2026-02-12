import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import Job, { IJob } from '../models/jobModel';
import Customer from '../models/customerModel';
import Vehicle from '../models/vehicleModel';
// ----------------------
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildJobFilter } from './filters/jobFilters';

// ----------------------
// DTO / Typed interfaces
// ----------------------
interface JobService {
  name: string;
  price?: number;
  quantity?: number;
}

interface ClientDTO {
  name: string;
  phone: string;
}

interface VehicleDTO {
  make: string;
  model: string;
  year: number;
}

interface SaveJobCardDTO {
  clientJobId: string;
  userId: string;
  vin: string;
  client: ClientDTO;
  description: string;
  vehicle: VehicleDTO;
  services: JobService[];
  status: IJob['status'];
  clientUpdatedAt?: Date;
}

// ----------------------
// Save Job Card
// ----------------------
export const saveJobCard = async (req: AuthRequest, res: Response) => {
  try {
    
    const {
      clientJobId,
      userId,
      vin,
      client,
      vehicle,
      services,
      description,
      status,
      clientUpdatedAt
    } = req.body as SaveJobCardDTO;

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Ensure customer exists
      let customer: any = await Customer.findOne({ phone: client.phone }).session(session);
      if (!customer) {
        customer = await Customer.create([{ name: client.name, phone: client.phone }], { session });
        customer = customer[0];
      }

      // 2️⃣ Ensure vehicle exists
      let existingVehicle: any = await Vehicle.findOne({ vin }).session(session);
      if (!existingVehicle) {
        existingVehicle = await Vehicle.create([{
          vin,
          make: vehicle.make,
          car_model: vehicle.model,
          year: vehicle.year,
          owner_id: customer._id
        }], { session });
        existingVehicle = existingVehicle[0];
      }

      // 3️⃣ Save job card
      const jobCard = await Job.create([{
        clientJobId,
        userId,
        vin,
        services,
        client: customer._id,
        description,
        status,
        clientUpdatedAt
      }], { session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ message: ' Job card saved successfully', jobCard: jobCard[0] });

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    console.error(' Error saving job card:', error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------------
// Get Jobs


export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);
    const status = parseQueryParam(req.query.status as string);

    const filter = buildJobFilter({
      clinicId: req.user?.clinicId,
      search,
      status,
    });

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('department', 'name code')
        .populate({
          path: 'assignedTo',
          select: 'name email role department',
          populate: { path: 'department', select: 'name code' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Job.countDocuments(filter),
    ]);

    res.status(200).json({
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: error.message });
  }
};


// ----------------------
// Create Job
// ----------------------
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const jobData = req.body as SaveJobCardDTO;
    const job = new Job(jobData);
    await job.save();
    res.status(201).json(job);
  } catch (error: any) {
    console.error(' Error creating job:', error);
    res.status(500).json({ message: error.message });
  }
};

// ----------------------
// Delete Job (soft delete)
// ----------------------
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: ' Job deleted', job });
  } catch (error: any) {
    console.error(' Error deleting job:', error);
    res.status(500).json({ message: error.message });
  }
};
