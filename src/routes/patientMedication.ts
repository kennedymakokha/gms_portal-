import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';


import { createMedications, getMedications } from '../controllers/patientsMedications';


router.post('/patient-medications', authenticate, authorize([UserRole.admin]), createMedications);   // Create
router.get('/patient-medications', authenticate, authorize([UserRole.admin]), getMedications);      // Read


export default router;