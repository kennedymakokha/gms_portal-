import express from 'express';
const router = express.Router();
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController'; 
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';


router.post('/departments',authenticate, authorize([UserRole.ADMIN]), createDepartment);   // Create
router.get('/departments',authenticate, authorize([UserRole.ADMIN]), getDepartments);      // Read
router.put('/departments/:id',authenticate, authorize([UserRole.ADMIN]), updateDepartment); // Update
router.delete('/departments/:id',authenticate, authorize([UserRole.ADMIN]), deleteDepartment); // Delete

export default router;