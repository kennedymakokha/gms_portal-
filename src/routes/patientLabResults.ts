import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { getLabResults } from '../controllers/patientsLabResults';
import { createLabResults } from '../controllers/patientsLabResults';
router.post('/patient-lab-results', authenticate, authorize([UserRole.ADMIN]), createLabResults);   // Create
router.get('/patient-lab-results', authenticate, authorize([UserRole.ADMIN]), getLabResults);      // Read


export default router;