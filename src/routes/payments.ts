import express from 'express';
const router = express.Router();
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';
import { createPayment, getmonthlysum, getPayments,  } from '../controllers/paymentsController';



router.post('/payments', authenticate, authorize([UserRole.admin]), createPayment);   // Create
router.get('/payments', authenticate, authorize([UserRole.admin]), getPayments); 
router.get('/payments/monthly-payments', authenticate, authorize([UserRole.admin]), getmonthlysum); 


// router.get('/payments/q', authenticate, authorize([UserRole.admin]), getPaymentsByClinic); 

export default router;