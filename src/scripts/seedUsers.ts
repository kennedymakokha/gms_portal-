
import "dotenv/config";
import mongoose from "mongoose";

import User, { UserRole } from "../models/userModel";
import Pharmacy from "../models/pharmacyModel";

const demoUsers = [
  {
    name: "David Mwangi",
    username: "david.mwangi",
    phone_number: "0700000101",
    email: "pharmacist@example.test",
    role: UserRole.pharmacist,
    specialty: "Pharmacy",
    qualification: "Bachelor of Pharmacy",
    experience: 5,
  },
  {
    name: "Mary Achieng",
    username: "mary.achieng",
    phone_number: "0700000102",
    email: "patient@example.test",
    role: UserRole.patient,
    specialty: "Patient",
    qualification: "",
    experience: 0,
  },
  {
    name: "Peter Otieno",
    username: "peter.otieno",
    phone_number: "0700000103",
    email: "finance@example.test",
    role: UserRole.finance,
    specialty: "Finance",
    qualification: "Accounting",
    experience: 3,
  },
];
const seedUsers = async () => {
  const uri = process.env.MONGO_URI;
  const password = process.env.SEED_USERS_PASSWORD;

  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }

  if (!password || password.length < 8) {
    throw new Error(
      "SEED_USERS_PASSWORD is required and must be at least 8 characters."
    );
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  try {
    // ---------------------------------------
    // 1. Find the pharmacy administrator
    // ---------------------------------------

    const admin = await User.findOne({
      role: UserRole.admin,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    if (!admin?.pharmacy) {
      throw new Error(
        "Pharmacy administrator not found. Run seedPharmacy.ts first."
      );
    }

    const pharmacyId = admin.pharmacy;

    const pharmacy = await Pharmacy.findById(pharmacyId);

    if (!pharmacy) {
      throw new Error("Administrator's pharmacy was not found.");
    }

    console.log(`Seeding users for ${pharmacy.name}`);

    // ---------------------------------------
    // 2. Ensure the administrator is present
    // ---------------------------------------

    console.log(`Admin exists: ${admin.name}`);

    // ---------------------------------------
    // 3. Create remaining role accounts
    // ---------------------------------------

    for (const item of demoUsers) {
      const uuid = `DEMO-${item.role.toUpperCase()}-${pharmacyId}`;

      // Find this exact seeded account first.
      const existingSeed = await User.findOne({
        pharmacy: pharmacyId,
        uuid,
      });

      if (existingSeed) {
        console.log(`${item.role} already exists: ${existingSeed.name}`);
        continue;
      }

      const existingUsername = await User.findOne({
        username: item.username,
      });

      if (existingUsername) {
        throw new Error(
          `Username ${item.username} already belongs to another user.`
        );
      }

      const existingPhone = await User.findOne({
        pharmacy: pharmacyId,
        phone_number: item.phone_number,
        isDeleted: false,
      });

      if (existingPhone) {
        throw new Error(
          `Phone ${item.phone_number} already exists in this pharmacy.`
        );
      }

      const existingEmail = await User.findOne({
        pharmacy: pharmacyId,
        email: item.email,
        isDeleted: false,
      });

      if (existingEmail) {
        throw new Error(
          `Email ${item.email} already exists in this pharmacy.`
        );
      }

      const user = new User({
        name: item.name,
        username: item.username,
        phone_number: item.phone_number,
        email: item.email,
        password,
        role: item.role,
        uuid,
        pharmacy: pharmacyId,
        createdBy: admin._id,
        specialty: item.specialty,
        qualification: item.qualification,
        experience: item.experience,
        status: "active",
        isDeleted: false,
        deletedAt: null,
      });

      // Uses the User model's pre-save password hashing hook.
      await user.save();

      console.log(`Created ${item.role}: ${item.name}`);
    }

    // ---------------------------------------
    // 4. Verify all enabled roles
    // ---------------------------------------


    console.log("\n========== USER SEED SUMMARY ==========");

    const roles = Object.values(UserRole);

    for (const role of roles) {
      const count = await User.countDocuments({
        pharmacy: pharmacyId,
        role,
        isDeleted: false,
      });

      console.log(`${role}: ${count} user(s)`);
    }

    const totalUsers = await User.countDocuments({
      pharmacy: pharmacyId,
      isDeleted: false,
    });

    console.log("---------------------------------------");
    console.log(`Total active users: ${totalUsers}`);
    console.log(`Pharmacy: ${pharmacy.name}`);
    console.log("=======================================\n");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedUsers().catch((error) => {
  console.error("User seed failed:", error);
  process.exitCode = 1;
});
