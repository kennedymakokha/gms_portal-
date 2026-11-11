
import { Request, Response } from "express";
import { Types } from "mongoose";
import Customer from "../models/customerModel";

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();

    const filter: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const address = String(req.body.address || "").trim();

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone number are required",
      });
    }

    const existing = await Customer.findOne({
      phone,
      isDeleted: { $ne: true },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A customer with this phone number already exists",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Create customer error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A customer with this phone number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const updates: Record<string, string> = {};

    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim();
      if (!updates.name) {
        return res.status(400).json({
          success: false,
          message: "Customer name cannot be empty",
        });
      }
    }

    if (req.body.phone !== undefined) {
      updates.phone = String(req.body.phone).trim();
      if (!updates.phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number cannot be empty",
        });
      }
    }

    if (req.body.email !== undefined) {
      updates.email = String(req.body.email).trim().toLowerCase();
    }

    if (req.body.address !== undefined) {
      updates.address = String(req.body.address).trim();
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Update customer error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another customer already uses this phone number",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
        },
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};
