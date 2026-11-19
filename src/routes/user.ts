
import express from "express";

import {
  getUserOverview,
  getUsers,
  login,
  register,
  syncUsers,
  updateUser,
  deleteUser,
} from "../controllers/authController";

import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../models/userModel";

const router = express.Router();

// Authentication
router.post("/auth/login", login);

// User management
router.post(
  "/auth",
  authenticate,
  authorize([UserRole.admin]),
  register
);

router.get(
  "/auth",
  authenticate,
  authorize([UserRole.admin]),
  getUsers
);

router.get(
  "/auth/overview",
  authenticate,
  authorize([UserRole.admin]),
  getUserOverview
);

// Sync users
router.get(
  "/auth/sync",
  authenticate,
  authorize([UserRole.admin]),
  syncUsers
);

// Update and delete
router.put(
  "/auth/:id",
  authenticate,
  authorize([UserRole.admin]),
  updateUser
);

router.delete(
  "/auth/:id",
  authenticate,
  authorize([UserRole.admin]),
  deleteUser
);

export default router;
