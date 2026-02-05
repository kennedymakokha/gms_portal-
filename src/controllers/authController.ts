import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/userModel';
import { Format_phone_number } from '../utils/formatNUmber';
import generateTokens from '../utils/generatetoken';


import { serialize } from "cookie";
import bcrypt from "bcryptjs";


import { jwtDecode } from "jwt-decode";
import { MakeActivationCode } from '../utils/mkActivation';
import { AuthRequest } from '../middleware/auth';
import { Query } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_change_in_prod';
export const login = async (req: Request, res: Response) => {

  try {
    if (req.method !== "POST") {
      res.status(405).json("Method Not Allowed")
      return
    };
    console.log(req.body)
    const { phone_number, password } = req.body;
    let phone = await Format_phone_number(phone_number); //format the phone number

    const userExists: any = await User.findOne({
      $or: [
        { username: phone_number },
        { phone_number: phone }
      ]
    }).select("phone_number username role activated password clinic").populate('clinic');

    if (!userExists) {
      res.status(400).json("User Not Found")
      return
    }

    if (!userExists || !(await bcrypt.compare(password, userExists.password))) {
      res.status(401).json("Invalid credentials");
      return
    } else {

      const { accessToken, refreshToken } = generateTokens(userExists);
      const decoded = jwtDecode(accessToken);

      res.setHeader("Set-Cookie", serialize("sessionToken", accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production", // Enable in production
        sameSite: "lax",
        path: "/",
        maxAge: 3600, // 1 hour
      }));

      res.status(200).json({ ok: true, message: "Logged in", token: accessToken, exp: decoded?.exp, user: userExists });
      return
    }

  } catch (error) {
    console.log(error)
  }


};

export const register = async (req: AuthRequest, res: Response) => {

  try {
    const {
      uuid, // generate new UUID if not provided
      name,
      phone_number,
      password,
      role,
      department,
      clinic,
      email,
      specialty,
      status = 'active',
      experience,
      qualification,
      avatar,
      schedule,
      isDeleted

    } = req.body;

    // Format phone number
    const formattedPhone = await Format_phone_number(phone_number);

    // Use findOneAndUpdate with upsert like createDrug
    const user = await User.findOneAndUpdate(
      { uuid },
      {
        $set: {
          name,
          username: formattedPhone,
          phone_number: formattedPhone,
          password: password || formattedPhone,
          role: role,
          department,
          clinic: req.user?.clinicId,
          email,
          specialty,
          status,
          experience,
          qualification,
          avatar,
          schedule,
          isDeleted,
          deletedAt: isDeleted ? new Date() : null,
          updated_at: new Date()
        },
        $setOnInsert: {
          uuid, // ensure UUID is set on insert
          created_by: req.user?.id,
          created_at: new Date()
        }
      },
      {
        upsert: true,
        new: true
      }
    );
    console.log("user",user)
    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      user
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getUserOverview = async (req: AuthRequest, res: Response) => {
  try {

    const { role } = req.params
    // Base filter
    const filter: any = {
      clinic: req.user?.clinicId,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    };

    // Optional role filter
    if (role) {
      filter.role = role;
    }
    const result = await User.find(filter).select('name department specialty role')



    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    // ================= HELPERS =================
    const cleanQuery = (value: unknown): string | undefined => {
      if (
        typeof value !== "string" ||
        value.trim() === "" ||
        value === "undefined" ||
        value === "null"
      ) {
        return undefined;
      }
      return value.trim();
    };

    // ================= PAGINATION =================
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // ================= QUERY PARAMS =================
    const search = cleanQuery(req.query.search);
    const role = cleanQuery(req.query.role);

    // ================= BASE FILTER =================
    const filter: Record<string, any> = {
      clinic: req.user?.clinicId,
      deletedAt: null,
      $or: [{ isDeleted: false }, { isDeleted: null }],
    };

    // ================= OPTIONAL ROLE FILTER =================
    if (role) {
      filter.role = role;
    }

    // ================= OPTIONAL SEARCH =================
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone_number: { $regex: search, $options: "i" } },
        { nationalId: { $regex: search, $options: "i" } },
      ];
    }

    // ================= DB QUERY =================
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    // ================= RESPONSE =================
    res.status(200).json({
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
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};



export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { name } = req.body;
    const dept = await User.findOneAndUpdate({ uuid }, { name }, { new: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: ' Department updated', dept });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const harddeleteUser = async (req: AuthRequest, res: Response) => {
  try {


    const { id } = req.params; // or uuid — whichever you chose


    const dept = await User.findOneAndDelete({ uuid: id });

    if (!dept) {

      return res.status(404).json({ error: 'Department not found' });
    }


    res.json({ message: ' Department deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// soft Delete
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const user = await User.findOneAndUpdate(
      { uuid: id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(405).json({
        error: 'User not found or already deleted',
      });
    }

    return res.status(200).json({
      message: ' User soft-deleted successfully',
      user,
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

export const syncUsers = async (req: Request, res: Response) => {
  try {
    const since = Number(req.query.since || 0);

    const users = await User.find({
      updatedAt: { $gt: new Date(since) }
    });

    res.json(users.map((u: any) => ({
      uuid: u.uuid,
      name: u.name,
      phone: u.phone,
      role: u.role,
      deptId: u.deptId,
      deletedAt: u.deletedAt,
      updatedAt: u.updatedAt
    })));
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' });
  }
};

