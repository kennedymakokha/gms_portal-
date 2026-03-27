import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createAppoinment, getAppoinmentOverview, getAppoinments } from '../controllers/ApoointmentsController';


router.post('/appointments', authenticate, authorize([UserRole.admin,UserRole.doctor]), createAppoinment);   // Create
router.get('/appointments', authenticate, authorize([UserRole.admin,UserRole.doctor]), getAppoinments); 
router.get('/appointments/overview', authenticate, authorize([UserRole.admin,UserRole.doctor]), getAppoinmentOverview);      // Read


export default router;