
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Request } from "express";

import User, { UserRole } from "../models/userModel";
import Pharmacy from "../models/pharmacyModel";

const JWT_SECRET =
  process.env.JWT_SECRET || "development_secret_key_change_in_prod";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username?: string;
    role: UserRole;
    clinicId?: string;
    clinic?: any;
    pharmacyId?: string;
    branchId?: string;
  };
}

interface JwtPayload {
  id: string;
  username?: string;
  role: UserRole;
  clinicId?: string;
  branchId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Extract token
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  // 2. Verify JWT
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  try {
    // 3. Retrieve the actual user from MongoDB
    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: false,
    }).select("_id name role pharmacy branch isDeleted status");

    if (!user) {
      return res.status(401).json({
        message: "User account not found or has been deleted",
      });
    }

    // 4. Reject explicitly inactive accounts
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Contact your administrator.",
      });
    }

    // 5. Ensure the user belongs to a pharmacy
    if (!user.pharmacy) {
      return res.status(403).json({
        message: "Your account is not assigned to a pharmacy",
      });
    }

    // 6. Retrieve and verify the pharmacy
    const pharmacy = await Pharmacy.findById(user.pharmacy)
      .select("_id name isActive");

    if (!pharmacy) {
      return res.status(403).json({
        message: "Assigned pharmacy could not be found",
      });
    }

    if (!pharmacy.isActive) {
      return res.status(403).json({
        message: "This pharmacy is currently inactive",
      });
    }

    // 7. Attach trusted database information to request
    req.user = {
      id: user._id.toString(),
      username: user.name,
      role: user.role as UserRole,
      pharmacyId: pharmacy._id.toString(),
      branchId: user.branch?.toString(),
      clinicId: decoded.clinicId,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Authentication could not be completed",
    });
  }
};

// Role-based authorization
export const authorize = (roles: UserRole[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};
