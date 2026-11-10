
import express from "express";

import {
  getPurchases,
  createPurchase,
  receivePurchase,
} from "../controllers/purchaseController";

import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

router.get("/", getPurchases);
router.post("/", createPurchase);
router.patch("/:id/receive", receivePurchase);

export default router;
