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

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_change_in_prod';
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

export const register = async (req: Request, res: Response) => {
  try {

    const { name, password, deptId, clinic } = req.body;

    let phone = await Format_phone_number(req.body.phone); //format the phone number
    const userExists: any = await User.findOne(
      {
        $or: [
          { username: req.body.phone },
          { phone_number: phone }
        ],

      }
    );

    if (userExists) {
      res.status(400).json("User already exists")
      return
    }

    let activationcode = MakeActivationCode(4)
    req.body.phone_number = phone
    req.body.department = deptId
    req.body.password = phone
    req.body.role = req.body.role.toUpperCase()


    const user: any = new User(req.body);
    const newUser = await user.save();

    // await sendTextMessage(
    //     `Hi ${newUser.username} \nWelcome to Marapesa\nYour your activation Code is ${activationcode}`,
    //     `${phone}`,
    //     newUser._id,
    //     "account-activation"
    // )
    res.status(201).json({ ok: true, message: "User registered successfully", newUser });
    return;

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error });
    return;

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

