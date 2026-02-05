import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createVisit, deletevisit, getvisits } from '../controllers/VisitController';


router.post('/visits', authenticate, authorize([UserRole.admin,UserRole.nurse]), createVisit);   // Create
router.get('/visits', authenticate, authorize([UserRole.admin,UserRole.nurse]), getvisits);      // Read
// router.put('/visits/:id', authenticate, authorize([UserRole.admin]), updatepatient); // Update
router.delete('/visits/:id', authenticate, authorize([UserRole.admin]), deletevisit); // Delete

export default router;