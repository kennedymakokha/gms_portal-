import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createpatient, deletepatient, getpatients, updatepatient } from '../controllers/patientController';


router.post('/patients', authenticate, authorize([UserRole.ADMIN]), createpatient);   // Create
router.get('/patients', authenticate, authorize([UserRole.ADMIN]), getpatients);      // Read
router.put('/patients/:id', authenticate, authorize([UserRole.ADMIN]), updatepatient); // Update
router.delete('/patients/:id', authenticate, authorize([UserRole.ADMIN]), deletepatient); // Delete

export default router;