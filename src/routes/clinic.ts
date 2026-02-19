import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { deleteUser, login, register, syncUsers, updateUser } from '../controllers/authController';
import { getbranches, getclinics, saveBranch, saveClinic } from '../controllers/clinicController';


router.post('/clinic', authenticate, authorize([UserRole.admin]), saveClinic);   // Create
router.post('/clinic/branch', authenticate, authorize([UserRole.admin]), saveBranch);   // Create
router.get('/clinic/branch', authenticate, authorize([UserRole.admin]), getbranches);   // get
router.get('/clinic', getclinics);      // Read
router.put('/clinic/:id', authenticate, authorize([UserRole.admin]), updateUser); // Update
router.delete('/clinic/:id', authenticate, authorize([UserRole.admin]), deleteUser); // Delete
router.get('/clinic', authenticate, authorize([UserRole.admin]), syncUsers); // sync



export default router;