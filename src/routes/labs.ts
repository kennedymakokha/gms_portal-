import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createlab, deletelab, getLabs, updatelab } from '../controllers/labTests';


router.post('/lab-tests',authenticate, authorize([UserRole.ADMIN]), createlab);   // Create
router.get('/lab-tests',authenticate, authorize([UserRole.ADMIN]), getLabs);      // Read
router.put('/lab-tests/:id',authenticate, authorize([UserRole.ADMIN]), updatelab); // Update
router.delete('/lab-tests/:id',authenticate, authorize([UserRole.ADMIN]), deletelab); // Delete

export default router;