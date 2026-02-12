import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createPayment, getPayments } from '../controllers/paymentsController';



router.post('/payments', authenticate, authorize([UserRole.admin]), createPayment);   // Create
router.get('/payments', authenticate, authorize([UserRole.admin]), getPayments); 


export default router;