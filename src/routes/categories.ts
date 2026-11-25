import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController';


router.post('/categories',authenticate,authorize([UserRole.admin]), createCategory);   // Create
router.get('/categories',authenticate,authorize([UserRole.admin]), getCategories);      // Read
router.put('/categories/:uuid', authenticate, authorize([UserRole.admin]), updateCategory); // Update
router.delete('/categories/:uuid', authenticate, authorize([UserRole.admin]), deleteCategory); // Delete

export default router;