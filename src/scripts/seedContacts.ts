
import "dotenv/config";
import mongoose from "mongoose";

import User, { UserRole } from "../models/userModel";
import Customer from "../models/customerModel";
import Supplier from "../models/supplierModel";

const customers = [
  {
    name: "Mary Achieng",
    phone: "0712000111",
    email: "",
    address: "Nairobi, Kenya",
    visits: 4,
  },
  {
    name: "James Otieno",
    phone: "0722000222",
    email: "",
    address: "Nairobi, Kenya",
    visits: 2,
  },
];

const suppliers = [
  {
    name: "Med Supplies Ltd",
    phone: "0700111222",
    email: "sales@medsupplies.test",
    address: "Nairobi, Kenya",
    contactPerson: "Sales Department",
  },
  {
    name: "Health Distributors",
    phone: "0700333444",
    email: "orders@health.test",
    address: "Nairobi, Kenya",
    contactPerson: "Orders Department",
  },
];

const seedContacts = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  try {
    // Find administrator and pharmacy
    const admin = await User.findOne({
      role: UserRole.admin,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    if (!admin?.pharmacy) {
      throw new Error(
        "No pharmacy-linked administrator found. Run seedPharmacy.ts first."
      );
    }

    const pharmacyId = admin.pharmacy;

    console.log(`Seeding contacts for pharmacy: ${pharmacyId}`);

    // --------------------------------
    // Seed customers
    // --------------------------------

    for (const item of customers) {
      await Customer.findOneAndUpdate(
        {
          pharmacy: pharmacyId,
          phone: item.phone,
        },
        {
          $set: {
            name: item.name,
            email: item.email,
            address: item.address,
            visits: item.visits,
            isDeleted: false,
          },
          $setOnInsert: {
            pharmacy: pharmacyId,
            phone: item.phone,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Customer ready: ${item.name}`);
    }

    // --------------------------------
    // Seed suppliers
    // --------------------------------

    for (const item of suppliers) {
      await Supplier.findOneAndUpdate(
        {
          pharmacy: pharmacyId,
          phone: item.phone,
        },
        {
          $set: {
            name: item.name,
            email: item.email,
            address: item.address,
            contactPerson: item.contactPerson,
            isDeleted: false,
            deletedAt: null,
          },
          $setOnInsert: {
            pharmacy: pharmacyId,
            phone: item.phone,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Supplier ready: ${item.name}`);
    }

    // --------------------------------
    // Summary
    // --------------------------------

    const customerCount = await Customer.countDocuments({
      pharmacy: pharmacyId,
      isDeleted: false,
    });

    const supplierCount = await Supplier.countDocuments({
      pharmacy: pharmacyId,
      isDeleted: false,
    });

    console.log("\n========== CONTACT SEED COMPLETE ==========");
    console.log(`Customers: ${customerCount}`);
    console.log(`Suppliers: ${supplierCount}`);
    console.log("============================================");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedContacts().catch((error) => {
  console.error("Contact seed failed:", error);
  process.exitCode = 1;
});
