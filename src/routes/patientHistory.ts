import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';

import { createHistory, getHistory } from '../controllers/patientsHistory';


router.post('/patient-history', authenticate, authorize([UserRole.ADMIN]), createHistory);   // Create
router.get('/patient-history', authenticate, authorize([UserRole.ADMIN]), getHistory);      // Read


export default router;