
import express from "express";
import {
  createMedicine,
  deleteMedicine,
  getMedicineById,
  getMedicines,
  updateMedicine,
} from "../controllers/medicineController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../models/userModel";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize([UserRole.admin, UserRole.pharmacist]), getMedicines);
router.get("/:id", authenticate, authorize([UserRole.admin, UserRole.pharmacist]), getMedicineById);
router.post("/", authenticate, authorize([UserRole.admin]), createMedicine);
router.put("/:id", authenticate, authorize([UserRole.admin]), updateMedicine);
router.delete("/:id", authenticate, authorize([UserRole.admin]), deleteMedicine);

export default router;
