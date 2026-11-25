
import { Request, Response } from "express";
import { Types } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { serialize } from "cookie";
import { jwtDecode } from "jwt-decode";
import Department from '../models/deptModel';
import User from "../models/userModel";
import { AuthRequest } from "../middleware/auth";
import { Format_phone_number } from "../utils/formatNUmber";
import generateTokens from "../utils/generatetoken";
import {
  generateSmartAbbreviation,
  getNextNumber,
} from "../utils/getNextNumber";

// ======================================================
// HELPERS
// ======================================================

const getPharmacyId = (req: AuthRequest): Types.ObjectId | null => {
  const pharmacyId = req.user?.pharmacyId;

  if (!pharmacyId || !Types.ObjectId.isValid(pharmacyId)) {
    return null;
  }

  return new Types.ObjectId(pharmacyId);
};

const cleanQuery = (value: unknown): string | undefined => {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value === "undefined" ||
    value === "null"
  ) {
    return undefined;
  }

  return value.trim();
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ======================================================
// LOGIN
// Global username login
// ======================================================

export const login = async (req: Request, res: Response) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method Not Allowed",
      });
    }

    const username = String(req.body.username || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const userExists = await User.findOne({
      username,
      isDeleted: { $ne: true },
    })
      .select("+password")
      .populate(
        "pharmacy",
        "name phone_number email currency timezone settings"
      )
      .populate({
        path: "branch",
        select: "pharmacy branchName address phone_number",
        populate: {
          path: "pharmacy",
          select: "name phone_number email",
        },
      })

    if (
      !userExists ||
      !(await bcrypt.compare(password, userExists.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (userExists.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const { accessToken } = generateTokens(userExists);
    const decoded = jwtDecode(accessToken);

    res.setHeader(
      "Set-Cookie",
      serialize("sessionToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
      })
    );


    // Never return the password hash
    const { password: _password, ...userData } = userExists.toObject();

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: accessToken,
      exp: decoded?.exp,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ======================================================
// REGISTER USER
// Pharmacy-scoped registration
// ======================================================


export const register = async (req: AuthRequest, res: Response) => {
  const pharmacyId = getPharmacyId(req);
  const userId = req.user?.id;
  const branchId = req.user?.branchId;

  if (!pharmacyId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not associated with a pharmacy.",
    });
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!branchId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not associated with a branch.",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const username = String(req.body.username || "")
      .trim()
      .toLowerCase();

    const name = String(req.body.name || "").trim();

    const phoneNumber = String(req.body.phone_number || "").trim();

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    const department = req.body.department || undefined;

    const role = req.body.role || "pharmacist";

    if (!username || !phoneNumber || !name) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Name, username and phone number are required.",
      });
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-30 characters and contain only letters, numbers, dots, underscores or hyphens.",
      });
    }

    if (password && password.length < 8) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    if (department && !Types.ObjectId.isValid(department)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid department ID.",
      });
    }

    const allowedRoles = [
      "admin",
      "doctor",
      "nurse",
      "receptionist",
      "pharmacist",
      "patient",
      "lab_tech",
      "finance",
    ];

    if (!allowedRoles.includes(role)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    const formattedPhone = await Format_phone_number(phoneNumber);

    // Check username globally and phone/email within this pharmacy.
    const existingUser = await User.findOne({
      isDeleted: { $ne: true },
      $or: [
        { username },
        {
          pharmacy: pharmacyId,
          phone_number: formattedPhone,
        },
        ...(email
          ? [
            {
              pharmacy: pharmacyId,
              email,
            },
          ]
          : []),
      ],
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();

      let message = "User already exists.";

      if (existingUser.username === username) {
        message = "Username is already taken.";
      } else if (existingUser.phone_number === formattedPhone) {
        message = "Phone number already exists in this pharmacy.";
      } else if (email && existingUser.email === email) {
        message = "Email already exists in this pharmacy.";
      }

      return res.status(409).json({
        success: false,
        message,
      });
    }

    // Validate department belongs to this pharmacy.
    if (department) {
      const departmentExists = await Department.findOne({
        _id: department,
        pharmacy: pharmacyId,
        isDeleted: { $ne: true },
      }).session(session);

      if (!departmentExists) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Department does not exist in this pharmacy.",
        });
      }
    }

    // Generate pharmacy/branch-specific UUID.
    let uuid = cleanQuery(req.body.uuid);

    if (!uuid) {
      uuid = await getNextNumber({
        base: generateSmartAbbreviation(role),
        pharmacyId: String(pharmacyId),
        branchId: String(branchId),
        session,
      });
    }

    const existingUuid = await User.findOne({
      pharmacy: pharmacyId,
      uuid,
      isDeleted: { $ne: true },
    }).session(session);

    if (existingUuid) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "User UUID already exists in this pharmacy.",
      });
    }

    // Never accept pharmacy or branch assignments from the request body.
    const userData = {
      username,
      name,
      phone_number: formattedPhone,
      email: email || undefined,
      uuid,
      pharmacy: pharmacyId,
      branch: branchId,
      department,
      createdBy: userId,
      role,
      status: req.body.status || "active",
      specialty: req.body.specialty || "",
      experience: Number(req.body.experience) || 0,
      qualification: req.body.qualification || "",
      avatar: req.body.avatar || "",
      schedule: req.body.schedule || "",
      isDeleted: false,
      deletedAt: null,

      // The model's pre-save hook hashes this password.
      password: password || formattedPhone,
    };

    const user = new User(userData);

    await user.save({ session });

    await session.commitTransaction();

    const { password: _password, ...userWithoutPassword } =
      user.toObject();

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: userWithoutPassword,
    });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Register user error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Username, phone number, email or UUID already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to register user.",
    });
  } finally {
    await session.endSession();
  }
};

// ======================================================
// USER OVERVIEW
// ======================================================

export const getUserOverview = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req);

    if (!pharmacyId) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy access is required",
      });
    }

    const { role } = req.params;

    const filter: Record<string, any> = {
      pharmacy: pharmacyId,
      isDeleted: { $ne: true },
    };

    if (role) {
      filter.role = role;
    }

    const result = await User.find(filter)
      .select("name username phone_number department specialty role status")
      .populate("department", "name")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Get user overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user overview",
    });
  }
};

// ======================================================
// GET USERS
// ======================================================

export const getUsers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req);

    if (!pharmacyId) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy access is required",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const search = cleanQuery(req.query.search);
    const role = cleanQuery(req.query.role);

    const filter: Record<string, any> = {
      pharmacy: pharmacyId,
      isDeleted: { $ne: true },
    };

    if (role) {
      filter.role = role;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: regex },
        { username: regex },
        { phone_number: regex },
        { email: regex },
        { uuid: regex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("department", "name")
        .populate("branch", "branchName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ======================================================
// UPDATE USER
// ======================================================

export const updateUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req);

    if (!pharmacyId) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy access is required",
      });
    }

    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const allowedFields = [
      "name",
      "phone_number",
      "email",
      "role",
      "specialty",
      "status",
      "experience",
      "qualification",
      "avatar",
      "schedule",
      "department",
      "branch",
    ];

    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.phone_number) {
      updateData.phone_number = await Format_phone_number(
        updateData.phone_number
      );
    }

    if (updateData.email !== undefined) {
      updateData.email = String(updateData.email).trim().toLowerCase();
    }

    if (updateData.name !== undefined) {
      updateData.name = String(updateData.name).trim();
    }

    if (updateData.department && !Types.ObjectId.isValid(updateData.department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    if (updateData.branch && !Types.ObjectId.isValid(updateData.branch)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: id,
        pharmacy: pharmacyId,
        isDeleted: { $ne: true },
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Phone number or email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// ======================================================
// HARD DELETE USER
// ======================================================

export const harddeleteUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req);

    if (!pharmacyId) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy access is required",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User UUID is required",
      });
    }

    const user = await User.findOneAndDelete({
      uuid: id,
      pharmacy: pharmacyId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (error: any) {
    console.error("Hard delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// ======================================================
// SOFT DELETE USER
// ======================================================

export const deleteUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req);

    if (!pharmacyId) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy access is required",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User UUID is required",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        uuid: id,
        pharmacy: pharmacyId,
        isDeleted: { $ne: true },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User soft-deleted successfully",
      user,
    });
  } catch (error: any) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// ======================================================
// SYNC USERS
// ======================================================

export const syncUsers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const pharmacyId = getPharmacyId(req);

    if (!pharmacyId) {
      return res.status(403).json({
        success: false,
        message: "Pharmacy access is required",
      });
    }

    const since = Number(req.query.since || 0);

    if (!Number.isFinite(since) || since < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid sync timestamp",
      });
    }

    const users = await User.find({
      pharmacy: pharmacyId,
      updatedAt: { $gt: new Date(since) },
    })
      .select(
        "uuid name phone_number role department deletedAt updatedAt isDeleted"
      )
      .lean();

    return res.status(200).json(
      users.map((user: any) => ({
        uuid: user.uuid,
        name: user.name,
        phone_number: user.phone_number,
        role: user.role,
        department: user.department,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
        updatedAt: user.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Sync users error:", error);

    return res.status(500).json({
      success: false,
      message: "Sync failed",
    });
  }
};
