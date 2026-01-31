import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createlab, deletelab, getLabs, updatelab } from '../controllers/labTests';


router.post('/lab-tests',authenticate, authorize([UserRole.admin]), createlab);   // Create
router.get('/lab-tests',authenticate, authorize([UserRole.admin]), getLabs);      // Read
router.put('/lab-tests/:id',authenticate, authorize([UserRole.admin]), updatelab); // Update
router.delete('/lab-tests/:id',authenticate, authorize([UserRole.admin]), deletelab); // Delete

export default router;