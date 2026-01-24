import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createDrug, deleteDrug, getDrugs, updateDrug } from '../controllers/drugController';


router.post('/drugs',authenticate, authorize([UserRole.ADMIN]), createDrug);   // Create
router.get('/drugs',authenticate, authorize([UserRole.ADMIN]), getDrugs);      // Read
router.put('/drugs/:id',authenticate, authorize([UserRole.ADMIN]), updateDrug); // Update
router.delete('/drugs/:id',authenticate, authorize([UserRole.ADMIN]), deleteDrug); // Delete

export default router;