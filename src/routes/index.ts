import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/userModel';

import * as authController from '../controllers/authController';
import * as syncController from '../controllers/syncController';
import * as jobController from '../controllers/jobController';
import * as inventoryController from '../controllers/inventoryController';
import * as departmentController from '../controllers/departmentController';

const router = Router();

// Auth
// router.post('/auth/register', authController.register);
// router.post('/auth/login', authController.login);

// Sync (Offline Capability)
router.get('/sync', authenticate, syncController.pullChanges);
router.post('/sync', authenticate, syncController.pushChanges);

// Jobs
// router.get('/jobs', authenticate, jobController.getJobs);
// // router.post('/jobs', authenticate, authorize([UserRole.ADMIN, UserRole.CLERK]), jobController.createJob);
// router.post('/jobs', authenticate, authorize([UserRole.ADMIN, UserRole.CLERK]), jobController.saveJobCard);
// router.delete('/jobs/:id', authenticate, authorize([UserRole.ADMIN]), jobController.deleteJob);


// Inventory
router.get('/inventory', authenticate, inventoryController.getInventory);
router.post('/inventory', authenticate, authorize([UserRole.ADMIN]), inventoryController.createItem);

export default router;