import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { getTasks, getTasksOverview } from '../controllers/patientsCareController';


// router.post('/patients-care', authenticate, authorize([UserRole.admin,UserRole.doctor]), getTasks);   // Create
router.get('/patients-care', authenticate, authorize([UserRole.admin,UserRole.doctor]), getTasks); 
router.get('/patients-care/overview', authenticate, authorize([UserRole.admin,UserRole.doctor]), getTasksOverview);      // Read


export default router;