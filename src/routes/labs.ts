import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createlab, getLabOverview, getLabs,  } from '../controllers/labTestsController';


router.post('/lab-tests',authenticate, authorize([UserRole.admin]), createlab);   // Create
router.get('/lab-tests',authenticate, authorize([UserRole.admin]), getLabs);      // Read
router.get('/lab-tests/overview',authenticate, authorize([UserRole.admin]), getLabOverview); // Read


export default router;