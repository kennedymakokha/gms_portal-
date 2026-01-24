import express from 'express';
const router = express.Router();
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { deleteUser, login, register, syncUsers, updateUser } from '../controllers/authController';


router.post('/auth/register', authenticate, authorize([UserRole.ADMIN]), register);   // Create
router.post('/auth/login', login);      // Read
router.put('/auth/:id', authenticate, authorize([UserRole.ADMIN]), updateUser); // Update
router.delete('/auth/:id', authenticate, authorize([UserRole.ADMIN]), deleteUser); // Delete
router.get('/auth', authenticate, authorize([UserRole.ADMIN]), syncUsers); // sync


export default router;