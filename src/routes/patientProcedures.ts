import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createPatientProcedures, getPatientProcedures } from '../controllers/patienProcedures';
router.post('/patient-procedures', authenticate, authorize([UserRole.admin]), createPatientProcedures);   // Create
router.get('/patient-procedures', authenticate, authorize([UserRole.admin]), getPatientProcedures);      // Read


export default router;