import express from 'express';
const router = express.Router();
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController'; 
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';


router.post('/departments',authenticate, authorize([UserRole.admin]), createDepartment);   // Create
router.get('/departments',authenticate, authorize([UserRole.admin]), getDepartments);      // Read
router.put('/departments/:id',authenticate, authorize([UserRole.admin]), updateDepartment); // Update
router.delete('/departments/:id',authenticate, authorize([UserRole.admin]), deleteDepartment); // Delete

export default router;