
import express from "express";
import {
  createSale,
  getSaleById,
  getSales,
} from "../controllers/salesController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", createSale);

export default router;
