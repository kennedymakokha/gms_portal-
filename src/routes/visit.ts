import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createVisit, deletevisit, getvisits } from '../controllers/VisitController';


router.post('/visits', authenticate, authorize([UserRole.ADMIN]), createVisit);   // Create
router.get('/visits', authenticate, authorize([UserRole.ADMIN]), getvisits);      // Read
// router.put('/visits/:id', authenticate, authorize([UserRole.ADMIN]), updatepatient); // Update
router.delete('/visits/:id', authenticate, authorize([UserRole.ADMIN]), deletevisit); // Delete

export default router;