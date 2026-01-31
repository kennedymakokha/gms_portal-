import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createpatient, deletepatient, getpatients, updatepatient } from '../controllers/patientController';


router.post('/patients', authenticate, authorize([UserRole.admin, UserRole.receptionist]), createpatient);   // Create
router.get('/patients', authenticate, authorize([UserRole.admin, UserRole.receptionist, UserRole.doctor, UserRole.nurse]), getpatients);      // Read
router.put('/patients/:id', authenticate, authorize([UserRole.admin, UserRole.receptionist]), updatepatient); // Update
router.delete('/patients/:id', authenticate, authorize([UserRole.admin]), deletepatient); // Delete

export default router;