import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';

import { createProcedure,  getProcedureOverview,  getProcedures } from '../controllers/ProcedureController';


router.post('/procedures', authenticate, authorize([UserRole.admin,UserRole.doctor]), createProcedure);   // Create
router.get('/procedures', authenticate, authorize([UserRole.admin,UserRole.doctor]), getProcedures);      // Read
router.get('/procedures/overview', authenticate, authorize([UserRole.admin,UserRole.doctor]), getProcedureOverview); 

export default router;