import express from 'express';
const router = express.Router();
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { deleteUser, getUserOverview, getUsers, login, register, syncUsers, updateUser } from '../controllers/authController';


router.post('/auth', authenticate, authorize([UserRole.admin]), register); // Create
router.get('/auth', authenticate, authorize([UserRole.admin,]), getUsers);  //Read 
router.get('/auth/overview', authenticate, authorize([UserRole.admin,]), getUserOverview);  //Read 
router.post('/auth/login', login);      // Read
router.put('/auth/:id', authenticate, authorize([UserRole.admin]), updateUser); // Update
router.delete('/auth/:id', authenticate, authorize([UserRole.admin]), deleteUser); // Delete
router.get('/auth', authenticate, authorize([UserRole.admin]), syncUsers); // sync


export default router;