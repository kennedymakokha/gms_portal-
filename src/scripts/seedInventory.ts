
import "dotenv/config";
import mongoose from "mongoose";

import User, { UserRole } from "../models/userModel";
import Pharmacy from "../models/pharmacyModel";
import Category from "../models/categoriesModel";
import Medicine from "../models/medicineModel";

const categories = [
  {
    name: "Analgesics",
    description: "Medicines used to relieve pain and reduce fever.",
  },
  {
    name: "Antibiotics",
    description: "Medicines used to treat bacterial infections.",
  },
  {
    name: "Vitamins",
    description: "Vitamin and nutritional supplements.",
  },
  {
    name: "Syrups",
    description: "Liquid oral medicines.",
  },
  {
    name: "Others",
    description: "Other pharmacy products and medicines.",
  },
];

const medicines = [
  {
    name: "Paracetamol 500mg",
    category: "Analgesics",
    manufacturer: "Mediplus",
    batch: "PCT001",
    expiry: "2027-05-30",
    price: 40,
    quantity: 200,
    reorder: 20,
  },
  {
    name: "Amoxicillin 500mg",
    category: "Antibiotics",
    manufacturer: "GSK",
    batch: "AMX002",
    expiry: "2027-03-15",
    price: 80,
    quantity: 15,
    reorder: 25,
  },
  {
    name: "Vitamin C 1000mg",
    category: "Vitamins",
    manufacturer: "Nature's Best",
    batch: "VTC003",
    expiry: "2027-08-20",
    price: 70,
    quantity: 100,
    reorder: 20,
  },
  {
    name: "Cough Syrup 100ml",
    category: "Syrups",
    manufacturer: "MediCare",
    batch: "CS004",
    expiry: "2026-12-10",
    price: 120,
    quantity: 50,
    reorder: 10,
  },
  {
    name: "Ibuprofen 400mg",
    category: "Analgesics",
    manufacturer: "HealthPlus",
    batch: "IBU005",
    expiry: "2026-12-20",
    price: 60,
    quantity: 12,
    reorder: 20,
  },
];

const seedInventory = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  try {
    // -----------------------------------------
    // 1. Find the first pharmacy administrator
    // -----------------------------------------

    const admin = await User.findOne({
      role: UserRole.admin,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    if (!admin) {
      throw new Error(
        "No administrator found. Run seedPharmacy.ts first."
      );
    }

    if (!admin.pharmacy) {
      throw new Error(
        "The administrator has no pharmacy assigned."
      );
    }

    const pharmacyId = admin.pharmacy;

    const pharmacy = await Pharmacy.findById(pharmacyId);

    if (!pharmacy) {
      throw new Error("The administrator's pharmacy does not exist.");
    }

    console.log(`Seeding inventory for: ${pharmacy.name}`);
    console.log(`Pharmacy ID: ${pharmacyId}`);

    // -----------------------------------------
    // 2. Seed categories
    // -----------------------------------------

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    for (const item of categories) {
      const category = await Category.findOneAndUpdate(
        {
          pharmacy: pharmacyId,
          name: item.name,
        },
        {
          $set: {
            description: item.description,
            isDeleted: false,
            deletedAt: null,
          },
          $setOnInsert: {
            pharmacy: pharmacyId,
            name: item.name,
            uuid: new mongoose.Types.ObjectId().toString(),
            created_by: admin._id,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      categoryMap.set(item.name, category._id);

      console.log(`Category ready: ${category.name}`);
    }

    // -----------------------------------------
    // 3. Seed medicines
    // -----------------------------------------

    let created = 0;
    let updated = 0;

    for (const item of medicines) {
      const categoryId = categoryMap.get(item.category);

      if (!categoryId) {
        throw new Error(
          `Category ${item.category} was not found.`
        );
      }

      const existing = await Medicine.findOne({
        pharmacy: pharmacyId,
        name: item.name,
        batch: item.batch,
      });

      if (existing) {
        // Do not overwrite stock quantities on reruns.
        await Medicine.updateOne(
          { _id: existing._id, pharmacy: pharmacyId },
          {
            $set: {
              category: categoryId,
              manufacturer: item.manufacturer,
              expiry: new Date(item.expiry),
              price: item.price,
              reorder: item.reorder,
              isDeleted: false,
              deletedAt: null,
            },
          }
        );

        updated++;
        console.log(`Medicine updated: ${item.name}`);
      } else {
        await Medicine.create({
          name: item.name,
          category: categoryId,
          pharmacy: pharmacyId,
          manufacturer: item.manufacturer,
          batch: item.batch,
          expiry: new Date(item.expiry),
          price: item.price,
          quantity: item.quantity,
          reorder: item.reorder,
          isDeleted: false,
          deletedAt: null,
        });

        created++;
        console.log(`Medicine created: ${item.name}`);
      }
    }

    // -----------------------------------------
    // 4. Summary
    // -----------------------------------------

    const categoryCount = await Category.countDocuments({
      pharmacy: pharmacyId,
      isDeleted: false,
    });

    const medicineCount = await Medicine.countDocuments({
      pharmacy: pharmacyId,
      isDeleted: false,
    });

    console.log("\n========== INVENTORY SEED COMPLETE ==========");
    console.log(`Pharmacy: ${pharmacy.name}`);
    console.log(`Categories: ${categoryCount}`);
    console.log(`Medicines: ${medicineCount}`);
    console.log(`New medicines: ${created}`);
    console.log(`Updated medicines: ${updated}`);
    console.log("==============================================");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedInventory().catch((error) => {
  console.error("Inventory seed failed:", error);
  process.exitCode = 1;
});
