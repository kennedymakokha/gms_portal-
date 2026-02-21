import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createVisit,  getLaborders, getLabordersByVisit, getvisits, updateSingleLabTestStatus } from '../controllers/VisitController';


router.post('/visits', authenticate, authorize([UserRole.admin,UserRole.nurse]), createVisit);   // Create
router.post('/visits/update-lab-order', authenticate, authorize([UserRole.admin,UserRole.nurse]), updateSingleLabTestStatus);   // Create

router.get('/visits', authenticate, authorize([UserRole.admin,UserRole.nurse]), getvisits);      // Read

router.get('/visits/lab-orders', authenticate, authorize([UserRole.admin,UserRole.nurse]), getLaborders);      // Read
router.get('/visits/lab-orders/:id', authenticate, authorize([UserRole.admin,UserRole.nurse]), getLabordersByVisit);      // Read


export default router;