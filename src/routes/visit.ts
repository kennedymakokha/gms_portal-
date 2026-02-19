import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createVisit, deletevisit, getLaborders, getvisits, updateSingleLabTestStatus } from '../controllers/VisitController';


router.post('/visits', authenticate, authorize([UserRole.admin,UserRole.nurse]), createVisit);   // Create
router.post('/visits/update-lab-order', authenticate, authorize([UserRole.admin,UserRole.nurse]), updateSingleLabTestStatus);   // Create

router.get('/visits', authenticate, authorize([UserRole.admin,UserRole.nurse]), getvisits);      // Read

router.get('/visits/lab-orders', authenticate, authorize([UserRole.admin,UserRole.nurse]), getLaborders);      // Read


export default router;