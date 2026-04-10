import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createPatient, deletepatient, getPatientByID, getpatients, getPatientsOverview, updatepatient } from '../controllers/patientController';

router.get('/patients/:id', authenticate, authorize([UserRole.admin,UserRole.doctor]), getPatientByID);
router.post('/patients', authenticate, authorize([UserRole.admin,UserRole.doctor, UserRole.receptionist]), createPatient);   // Create
router.get('/patients', authenticate, authorize([UserRole.admin,UserRole.doctor, UserRole.receptionist, UserRole.doctor, UserRole.nurse]), getpatients);      // Read
router.get('/patients/overview', authenticate, authorize([UserRole.admin,UserRole.doctor,UserRole.nurse, UserRole.receptionist]), getPatientsOverview); // read
router.delete('/patients/:id', authenticate, authorize([UserRole.admin,UserRole.doctor]), deletepatient); // Delete

export default router;