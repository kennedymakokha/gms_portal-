import express from "express";

import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  verifyPrescription,
} from "../controllers/prescriptionController";

import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

router.get("/", getPrescriptions);
router.get("/:id", getPrescriptionById);
router.post("/", createPrescription);
router.patch("/:id/verify", verifyPrescription);

export default router;