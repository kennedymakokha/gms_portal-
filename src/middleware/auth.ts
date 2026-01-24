import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Request } from "express"; // ✔ correct
import { UserRole } from '../models/userModel';
const JWT_SECRET = process.env.JWT_SECRET || "development_secret_key_change_in_prod";
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username?: string;
    role: UserRole;
    clinicId?: string;
  }
}
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Grab the token from the header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify it
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username?: string;
      role: UserRole;
      clinicId?: string;
    };

    // Attach to req.user
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      clinicId: decoded.clinicId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};