import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController';


router.post('/categories', createCategory);   // Create
router.get('/categories', getCategories);      // Read
router.put('/categories/:id', authenticate, authorize([UserRole.admin]), updateCategory); // Update
router.delete('/categories/:id', authenticate, authorize([UserRole.admin]), deleteCategory); // Delete

export default router;