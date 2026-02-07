import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createBed, getBedOverview, getBeds } from '../controllers/BedsController';
import { createWard, getWardOverview, getWards } from '../controllers/WardsController';


router.post('/wards', authenticate, authorize([UserRole.admin]), createWard);   // Create
router.get('/wards', authenticate, authorize([UserRole.admin]), getWards); 
router.get('/wards/overview', authenticate, authorize([UserRole.admin]), getWardOverview);      // Read


export default router;