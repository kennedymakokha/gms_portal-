import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import CareTask from '../models/patientCareModal';
import { getPagination } from '../utils/pagination';
import { parseQueryParam } from '../utils/queryParser';
import { buildPatientsCareFilter } from './filters/patientsCareFilters';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    // const d = await  CareTask.find()
    // for (let index = 0; index < d.length; index++) {
    //   const element = d[index];
    //   console.log(element.branch);
    //   console.log(".......");
    //   console.log(req?.user?.branchId);
    // }
   
    if (!req.user?.clinicId) {
      return res.status(400).json({ message: 'Clinic ID missing in token' });
    }

    const { page, limit, skip } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const search = parseQueryParam(req.query.search as string);

    const filter = buildPatientsCareFilter({
      clinicId: req.user.clinicId,
branchId: req.user.branchId,
      search,
    });

    const [tasks, total] = await Promise.all([
      CareTask.find(filter)
        
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      CareTask.countDocuments(filter),
    ]);

    res.status(200).json({
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getTasksOverview = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user?.clinicId;
    const result = await CareTask.find({
      clinic: clinicId,
      
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    })

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



// export const createBed = async (req: AuthRequest, res: Response) => {
//   try {
//     const { uuid, ward, type, status } = req.body;

//     if (!req.user?.clinicId) {
//       return res.status(400).json({ message: 'Clinic ID missing in token' });
//     }

//     const wardData: any = await Ward.findById(ward).select("type gender");
//     if (!wardData) {
//       return res.status(404).json({ message: "Ward not found" });
//     }

   

//     const bed = await CareTask.findOneAndUpdate(
//       { uuid },
//       {
//         $set: {
//           bedNumber,
//           ward,
//           wardType: wardData.type,
//           gender: wardData.gender,
//           type,
//           status,
//           clinic: req.user?.clinicId,
//           isDeleted: req.body.isDeleted ?? false,
//           updated_at: new Date(),
//         },
//         $setOnInsert: {
//           created_by: req.user?.id,
//           created_at: new Date(),
//         },
//       },
//       { upsert: true, new: true }
//     );

//     res.status(201).json(bed);
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };



// controllers/DrugController.js


