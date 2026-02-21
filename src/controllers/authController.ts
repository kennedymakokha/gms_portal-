import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/userModel';
import { Format_phone_number } from '../utils/formatNUmber';
import generateTokens from '../utils/generatetoken';

import Dept from '../models/deptModel';
import { serialize } from "cookie";
import bcrypt from "bcryptjs";


import { jwtDecode } from "jwt-decode";
import { MakeActivationCode } from '../utils/mkActivation';
import { AuthRequest } from '../middleware/auth';
import { Query } from 'mongoose';
import { generateSmartAbbreviation, getNextNumber } from '../utils/getNextNumber';

export const login = async (req: Request, res: Response) => {

  try {
    if (req.method !== "POST") {
      res.status(405).json("Method Not Allowed")
      return
    };

    const { phone_number, password } = req.body;
    let phone = await Format_phone_number(phone_number); //format the phone number

    const userExists: any = await User.findOne({
      $or: [
        { username: phone_number },
        { phone_number: phone }
      ]
    }).select("phone_number username name role activated password branch")
      .populate({
        path: 'branch',
        select: 'clinic branchName inpatient phone',
        populate: [
          {
            path: 'clinic',
            select: 'name branch',
          },
        ],
      })
    // .populate('clinic', 'branchName inpatient phone ');

    if (!userExists) {
      res.status(400).json("User Not Found")
      return
    }

    if (!userExists || !(await bcrypt.compare(password, userExists.password))) {
      res.status(401).json("Invalid credentials");
      return
    } else {

      const { accessToken } = generateTokens(userExists);
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

import mongoose from "mongoose";

export const register = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id!;
  const session = await mongoose.startSession(); // start session
 
  try {
    session.startTransaction(); // start transaction

    let {
      uuid,
      phone_number,
      password,
      department } = req.body;

    // Format phone number
    const formattedPhone = await Format_phone_number(phone_number);

    // 🔐 Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password || formattedPhone, salt);

    // Generate UUID inside transaction if not provided
    if (!uuid) {
      uuid = await getNextNumber({
        base: `${generateSmartAbbreviation(req.body.role)}`,
        clinicId: `${req.user?.clinicId}`,
        branchId: `${req.user?.branchId}`,
        session,
      });
    }
    const ALLOWED_UPDATE_FIELDS = [
      "name",
      "phone_number",
      "role",
      "email",
      "specialty",
      "status",
      "experience",
      "qualification",
      "avatar",
      "schedule",
      "isDeleted"

    ];

    const updateData: any = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    // Upsert user
    // 🔐 Hash password


    const user = await User.findOneAndUpdate(
      { uuid },
      {
        $setOnInsert: {
          uuid,
          created_by: userId,
          department: department,
          branch: `${req.user?.branchId}`,
          password: hashedPassword,
          created_at: new Date()
        },
        ...(Object.keys(updateData).length && { $set: updateData }),
      },

     {
        new: true,
        upsert: true,
        runValidators: true,
        session,

      }
    );

    // Add user to department staff list
    await Dept.findByIdAndUpdate(
      department,
      { $push: { staffs: user._id } },
      { session } // attach session here
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      user
    });
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();
    console.error(error);
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
      branch: req.user?.branchId,
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
    // for (let index = 0; index < users.length; index++) {
    //   const element = users[index];
    //   await Dept.findByIdAndUpdate(
    //     element.department,
    //     { $push: { staffs: element._id } },

    //   );

    // }
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

