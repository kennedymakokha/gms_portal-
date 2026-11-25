
import express from "express";
import {
  createSale,
  getSaleById,
  getSales,
} from "../controllers/salesController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../models/userModel";

const router = express.Router();

router.use(authenticate);

router.get("/", authenticate, authorize([UserRole.admin, UserRole.pharmacist]), getSales);
router.get("/:id", authenticate, authorize([UserRole.admin, UserRole.pharmacist]), getSaleById);
router.post("/", authenticate, authorize([UserRole.admin, UserRole.pharmacist]), createSale);

export default router;
