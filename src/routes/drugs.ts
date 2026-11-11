import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createDrug, deleteDrug, getDrugs, updateDrug } from '../controllers/drugController';


router.post('/pharmacy/medications',authenticate, authorize([UserRole.admin]), createDrug);   // Create
router.get('/pharmacy/medications',authenticate, authorize([UserRole.admin]), getDrugs);      // Read
router.put('/pharmacy/medications/:id',authenticate, authorize([UserRole.admin]), updateDrug); // Update
router.delete('/pharmacy/medications/:id',authenticate, authorize([UserRole.admin]), deleteDrug); // Delete

export default router;