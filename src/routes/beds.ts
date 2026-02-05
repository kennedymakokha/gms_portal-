import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createBed, getBeds } from '../controllers/BedsController';


router.post('/beds', authenticate, authorize([UserRole.admin]), createBed);   // Create
router.get('/beds', authenticate, authorize([UserRole.admin]), getBeds);      // Read


export default router;