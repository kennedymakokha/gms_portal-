import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createBed, getBedOverview, getBeds } from '../controllers/BedsController';


router.post('/beds', authenticate, authorize([UserRole.admin]), createBed);   // Create
router.get('/beds', authenticate, authorize([UserRole.admin]), getBeds); 
router.get('/beds/overview', authenticate, authorize([UserRole.admin]), getBedOverview);      // Read


export default router;