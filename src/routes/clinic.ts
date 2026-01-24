import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { deleteUser, login, register, syncUsers, updateUser } from '../controllers/authController';
import { getclinics, saveclinic } from '../controllers/clinicController';


router.post('/clinic', authenticate, authorize([UserRole.ADMIN]), saveclinic);   // Create
router.get('/clinic', getclinics);      // Read
router.put('/clinic/:id', authenticate, authorize([UserRole.ADMIN]), updateUser); // Update
router.delete('/clinic/:id', authenticate, authorize([UserRole.ADMIN]), deleteUser); // Delete
router.get('/clinic', authenticate, authorize([UserRole.ADMIN]), syncUsers); // sync


export default router;