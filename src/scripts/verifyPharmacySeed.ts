
import dotenv from "dotenv";
import mongoose from "mongoose";

import User, { UserRole } from "../models/userModel";
import Pharmacy from "../models/pharmacyModel";
import Category from "../models/categoriesModel";
import Medicine from "../models/medicineModel";
import Customer from "../models/customerModel";
import Supplier from "../models/supplierModel";
import Sale from "../models/salesModel";
import Purchase from "../models/purchaseModel";
import Prescription from "../models/prescriptionModel";

dotenv.config();

async function verifyPharmacySeed() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(mongoUri);
    console.log("\nConnected to MongoDB\n");

    const admin = await User.findOne({
      role: UserRole.admin,
      isDeleted: false,
      pharmacy: { $exists: true, $ne: null },
    }).sort({ createdAt: 1 });

    if (!admin || !admin.pharmacy) {
      throw new Error("No admin linked to a pharmacy was found.");
    }

    const pharmacyId = admin.pharmacy;

    const pharmacy = await Pharmacy.findById(pharmacyId);

    if (!pharmacy) {
      throw new Error("The admin's pharmacy record does not exist.");
    }

    console.log("PHARMACY");
    console.log("------------------------------");
    console.log("Name:", pharmacy.name);
    console.log("ID:", pharmacy._id);
    console.log("Active:", pharmacy.isActive);

    console.log("\nUSERS BY ROLE");
    console.log("------------------------------");

    for (const role of Object.values(UserRole)) {
      const count = await User.countDocuments({
        pharmacy: pharmacyId,
        role,
        isDeleted: false,
      });

      console.log(`${role}: ${count}`);
    }

    const collections: Array<{ name: string; model: mongoose.Model<any> }> = [
      { name: "Categories", model: Category },
      { name: "Medicines", model: Medicine },
      { name: "Customers", model: Customer },
      { name: "Suppliers", model: Supplier },
      { name: "Sales", model: Sale },
      { name: "Purchases", model: Purchase },
      { name: "Prescriptions", model: Prescription },
    ];

    console.log("\nPHARMACY DATA");
    console.log("------------------------------");

    for (const collection of collections) {
      const count = await collection.model.countDocuments({
        pharmacy: pharmacyId,
      });

      console.log(`${collection.name}: ${count}`);
    }

    console.log("\nVERIFICATION COMPLETE");
  } catch (error) {
    console.error("\nVerification failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

verifyPharmacySeed();
