import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';

import { createProcedure, deleteProcedure, getProcedures, updateProcedure } from '../controllers/Procedure';


router.post('/procedures', authenticate, authorize([UserRole.ADMIN]), createProcedure);   // Create
router.get('/procedures', authenticate, authorize([UserRole.ADMIN]), getProcedures);      // Read
router.put('/procedures/:id', authenticate, authorize([UserRole.ADMIN]), updateProcedure); // Update
router.delete('/procedures/:id', authenticate, authorize([UserRole.ADMIN]), deleteProcedure); // Delete

export default router;