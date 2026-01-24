import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { deleteJob, getJobs, saveJobCard } from '../controllers/jobController';

router.get('/jobs', authenticate, getJobs);
// router.post('/jobs', authenticate, authorize([UserRole.ADMIN, UserRole.CLERK]), createJob);
router.post('/jobs', authenticate, authorize([UserRole.ADMIN, UserRole.CLERK]), saveJobCard);
router.delete('/jobs/:id', authenticate, authorize([UserRole.ADMIN]), deleteJob);