import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';


import { createMedications, getMedications } from '../controllers/patientsMedications';


router.post('/patient-lab-results', authenticate, authorize([UserRole.ADMIN]), createMedications);   // Create
router.get('/patient-lab-results', authenticate, authorize([UserRole.ADMIN]), getMedications);      // Read


export default router;