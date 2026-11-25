
import "dotenv/config";
import mongoose from "mongoose";

import User, { UserRole } from "../models/userModel";
import Pharmacy from "../models/pharmacyModel";
import Branch from "../models/branchModel";
import Counter from "../models/CounterModel";

const seedPharmacy = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Vanesa Wachana";
  const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE;
  const ADMIN_EMAIL = (
    process.env.SEED_ADMIN_EMAIL || "info@example.com"
  ).trim().toLowerCase();

  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

  const ADMIN_USERNAME = (
    process.env.SEED_ADMIN_USERNAME ||
    process.env.ADMIN_USERNAME ||
    "adminuser"
  ).trim().toLowerCase();

  const PHARMACY_NAME =
    process.env.SEED_PHARMACY_NAME || "Good Health Pharmacy";

  const PHARMACY_PHONE =
    process.env.SEED_PHARMACY_PHONE || ADMIN_PHONE;

  const PHARMACY_EMAIL = (
    process.env.SEED_PHARMACY_EMAIL || ADMIN_EMAIL
  ).trim().toLowerCase();

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  if (!ADMIN_PHONE) {
    throw new Error("SEED_ADMIN_PHONE is required");
  }

  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required and must be at least 8 characters"
    );
  }

  if (!ADMIN_USERNAME) {
    throw new Error("SEED_ADMIN_USERNAME is required");
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // --------------------------------------------------
      // 1. Find or create administrator
      // --------------------------------------------------

      let admin = await User.findOne({
        phone_number: ADMIN_PHONE,
        isDeleted: false,
      }).session(session);

      if (admin) {
        if (admin.role !== UserRole.admin) {
          throw new Error(
            `Phone number ${ADMIN_PHONE} already belongs to a non-admin user.`
          );
        }

        // Check username ownership before updating.
        const usernameOwner = await User.findOne({
          username: ADMIN_USERNAME,
          _id: { $ne: admin._id },
        }).session(session);

        if (usernameOwner) {
          throw new Error(
            `Username "${ADMIN_USERNAME}" already belongs to another user.`
          );
        }

        admin.username = ADMIN_USERNAME;

        if (!admin.email) {
          admin.email = ADMIN_EMAIL;
        }

        await admin.save({ session });

        console.log("Existing administrator found:", admin.name);
      } else {
        const [existingUsername, existingEmail] = await Promise.all([
          User.findOne({ username: ADMIN_USERNAME }).session(session),
          User.findOne({ email: ADMIN_EMAIL, isDeleted: false }).session(session),
        ]);

        if (existingUsername) {
          throw new Error(
            `Username "${ADMIN_USERNAME}" is already in use.`
          );
        }

        if (existingEmail) {
          throw new Error(
            `Email "${ADMIN_EMAIL}" is already assigned to another user.`
          );
        }

        admin = new User({
          name: ADMIN_NAME,
          username: ADMIN_USERNAME,
          phone_number: ADMIN_PHONE,
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: UserRole.admin,
          uuid: `PHARMACY-ADMIN-${ADMIN_PHONE.replace(/\D/g, "")}`,
          specialty: "Pharmacy Administration",
          status: "active",
          experience: 0,
          qualification: "",
          isDeleted: false,
          deletedAt: null,
        });

        await admin.save({ session });

        console.log("Administrator created:", admin.name);
      }

      // --------------------------------------------------
      // 2. Find or create pharmacy
      // --------------------------------------------------

      let pharmacy = admin.pharmacy
        ? await Pharmacy.findById(admin.pharmacy).session(session)
        : null;

      if (!pharmacy) {
        pharmacy = await Pharmacy.findOne({
          name: PHARMACY_NAME,
          phone_number: PHARMACY_PHONE,
          createdBy: admin._id,
        }).session(session);
      }

      if (!pharmacy) {
        const [newPharmacy] = await Pharmacy.create(
          [
            {
              name: PHARMACY_NAME,
              phone_number: PHARMACY_PHONE,
              email: PHARMACY_EMAIL,
              address: "Nairobi, Kenya",
              currency: "KES",
              timezone: "Africa/Nairobi",
              settings: {
                tax_enabled: false,
                tax_rate: 0,
                low_stock_alerts: true,
                expiry_alerts: true,
                pending_order_alerts: true,
              },
              createdBy: admin._id,
              isActive: true,
            },
          ],
          { session }
        );

        pharmacy = newPharmacy;

        console.log("Pharmacy created:", pharmacy.name);
      } else {
        console.log("Existing pharmacy found:", pharmacy.name);
      }

      // --------------------------------------------------
      // 3. Find or create Main Branch
      // --------------------------------------------------

      let mainBranch = await Branch.findOne({
        pharmacy: pharmacy._id,
        branchName: "Main Branch",
        isDeleted: false,
      }).session(session);

      if (!mainBranch) {
        const [newBranch] = await Branch.create(
          [
            {
              branchName: "Main Branch",
              uuid: `MAIN-${pharmacy._id}`,
              pharmacy: pharmacy._id,
              created_by: admin._id,
              phone_number: PHARMACY_PHONE || ADMIN_PHONE,
              address: "Main Branch",
              isDeleted: false,
              deletedAt: null,
              departments: [],
            },
          ],
          { session }
        );

        mainBranch = newBranch;

        console.log("Main Branch created:", mainBranch._id);
      } else {
        console.log("Main Branch already exists:", mainBranch._id);
      }

      // --------------------------------------------------
      // 4. Attach administrator to pharmacy and branch
      // --------------------------------------------------

      admin.pharmacy = pharmacy._id;
      admin.branch = mainBranch._id;

      await admin.save({ session });

      console.log("Administrator assigned to Main Branch");

      // --------------------------------------------------
      // 5. Initialize branch counter
      // --------------------------------------------------

      await Counter.findOneAndUpdate(
        {
          pharmacy: pharmacy._id,
          branch: mainBranch._id,
          key: "default",
        },
        {
          $setOnInsert: {
            pharmacy: pharmacy._id,
            branch: mainBranch._id,
            key: "default",
            seq: 0,
          },
        },
        {
          upsert: true,
          new: true,
          session,
          setDefaultsOnInsert: true,
        }
      );

      console.log("Main Branch counter initialized");

      // --------------------------------------------------
      // 6. Summary
      // --------------------------------------------------

      console.log("\n======================================");
      console.log("PHARMACY SEED COMPLETED");
      console.log("======================================");

      console.log("Pharmacy:", pharmacy.name);
      console.log("Pharmacy ID:", pharmacy._id);

      console.log("Branch:", mainBranch.branchName);
      console.log("Branch ID:", mainBranch._id);

      console.log("Administrator:", admin.name);
      console.log("Username:", admin.username);
      console.log("Admin phone:", admin.phone_number);
      console.log("Admin ID:", admin._id);

      console.log("Counter key: default");
      console.log("Currency:", pharmacy.currency);
      console.log("Timezone:", pharmacy.timezone);

      console.log("======================================\n");
    });
  } finally {
    await session.endSession();
    await mongoose.disconnect();

    console.log("MongoDB disconnected");
  }
};

seedPharmacy().catch((error) => {
  console.error("Pharmacy seed failed:", error);
  process.exitCode = 1;
});
