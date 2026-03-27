import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createlab, getLabOverview, getLabs,  } from '../controllers/labTestsController';


router.post('/lab-tests',authenticate, authorize([UserRole.admin,UserRole.doctor]), createlab);   // Create
router.get('/lab-tests',authenticate, authorize([UserRole.admin,UserRole.doctor]), getLabs);      // Read
router.get('/lab-tests/overview',authenticate, authorize([UserRole.admin,UserRole.doctor]), getLabOverview); // Read


export default router;