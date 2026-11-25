
import "dotenv/config";
import mongoose from "mongoose";

import User, { UserRole } from "../models/userModel";
import Medicine from "../models/medicineModel";
import Customer from "../models/customerModel";
import Sale from "../models/salesModel";
import Purchase from "../models/purchaseModel";
import Prescription from "../models/prescriptionModel";

const DEMO_DATE = new Date("2026-11-08T09:00:00+03:00");

// The demo UI does not specify the supplier's purchase cost.
// Override this value in .env if you have the actual cost.
const PURCHASE_UNIT_COST = Number(
  process.env.SEED_PURCHASE_UNIT_COST || 40
);

const seedTransactions = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  try {
    // ------------------------------------------
    // 1. Find administrator and pharmacy
    // ------------------------------------------

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

    console.log(`Seeding transactions for pharmacy: ${pharmacyId}`);

    // ------------------------------------------
    // 2. Find medicines
    // ------------------------------------------

    const paracetamol = await Medicine.findOne({
      pharmacy: pharmacyId,
      name: "Paracetamol 500mg",
      batch: "PCT001",
      isDeleted: false,
    });

    const vitaminC = await Medicine.findOne({
      pharmacy: pharmacyId,
      name: "Vitamin C 1000mg",
      batch: "VTC003",
      isDeleted: false,
    });

    const amoxicillin = await Medicine.findOne({
      pharmacy: pharmacyId,
      name: "Amoxicillin 500mg",
      batch: "AMX002",
      isDeleted: false,
    });

    if (!paracetamol || !vitaminC || !amoxicillin) {
      throw new Error(
        "Required medicines not found. Run seedInventory.ts first."
      );
    }

    // ------------------------------------------
    // 3. Find customers
    // ------------------------------------------

    const mary = await Customer.findOne({
      pharmacy: pharmacyId,
      phone: "0712000111",
      isDeleted: false,
    });

    const james = await Customer.findOne({
      pharmacy: pharmacyId,
      phone: "0722000222",
      isDeleted: false,
    });

    if (!mary || !james) {
      throw new Error(
        "Required customers not found. Run seedContacts.ts first."
      );
    }

    // ------------------------------------------
    // 4. Seed sales
    // ------------------------------------------

    const sales = [
      {
        reference: "S-1001",
        items: [
          {
            medicine: paracetamol._id,
            medicineName: paracetamol.name,
            batch: paracetamol.batch,
            quantity: 2,
            unitPrice: 40,
            subtotal: 80,
          },
        ],
        customerName: "Walk-in customer",
        customer: null,
        paymentMethod: "cash" as const,
        totalAmount: 80,
        amountPaid: 80,
        change: 0,
        status: "completed" as const,
        createdAt: new Date("2026-11-08T09:45:00+03:00"),
      },
      {
        reference: "S-1000",
        items: [
          {
            medicine: vitaminC._id,
            medicineName: vitaminC.name,
            batch: vitaminC.batch,
            quantity: 1,
            unitPrice: 70,
            subtotal: 70,
          },
        ],
        customerName: mary.name,
        customer: mary._id,
        paymentMethod: "cash" as const,
        totalAmount: 70,
        amountPaid: 70,
        change: 0,
        status: "completed" as const,
        createdAt: new Date("2026-11-08T08:30:00+03:00"),
      },
    ];

    for (const sale of sales) {
      const { reference, createdAt, ...saleData } = sale;

      await Sale.findOneAndUpdate(
        {
          pharmacy: pharmacyId,
          reference,
        },
        {
          $set: {
            ...saleData,
            pharmacy: pharmacyId,
            updatedAt: createdAt,
          },
          $setOnInsert: {
            reference,
            createdAt,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Sale ready: ${reference}`);
    }

    // ------------------------------------------
    // 5. Seed purchase
    // ------------------------------------------

    if (
      !Number.isFinite(PURCHASE_UNIT_COST) ||
      PURCHASE_UNIT_COST < 0
    ) {
      throw new Error("SEED_PURCHASE_UNIT_COST must be a valid number.");
    }

    const purchaseQuantity = 100;
    const totalCost = purchaseQuantity * PURCHASE_UNIT_COST;

    await Purchase.findOneAndUpdate(
      {
        pharmacy: pharmacyId,
        orderNumber: "PO-201",
      },
      {
        $set: {
          pharmacy: pharmacyId,
          supplier: "Med Supplies Ltd",
          medicine: paracetamol._id,
          medicineName: paracetamol.name,
          quantity: purchaseQuantity,
          unitCost: PURCHASE_UNIT_COST,
          totalCost,
          status: "Pending",
          receivedAt: null,
        },
        $setOnInsert: {
          orderNumber: "PO-201",
          createdAt: DEMO_DATE,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Purchase ready: PO-201");

    // ------------------------------------------
    // 6. Seed prescriptions
    // ------------------------------------------

    const prescriptions = [
      {
        reference: "RX-001",
        patient: mary.name,
        medicine: amoxicillin._id,
        medicineName: amoxicillin.name,
        notes: "",
        status: "Verified" as const,
        verifiedAt: DEMO_DATE,
      },
      {
        reference: "RX-002",
        patient: james.name,
        medicine: paracetamol._id,
        medicineName: paracetamol.name,
        notes: "",
        status: "Pending" as const,
        verifiedAt: null,
      },
    ];

    for (const prescription of prescriptions) {
      const { reference, ...prescriptionData } = prescription;

      await Prescription.findOneAndUpdate(
        {
          pharmacy: pharmacyId,
          reference,
        },
        {
          $set: {
            ...prescriptionData,
            pharmacy: pharmacyId,
          },
          $setOnInsert: {
            reference,
            createdAt: DEMO_DATE,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Prescription ready: ${reference}`);
    }

    // ------------------------------------------
    // 7. Summary
    // ------------------------------------------

    const [
      saleCount,
      purchaseCount,
      prescriptionCount,
    ] = await Promise.all([
      Sale.countDocuments({ pharmacy: pharmacyId }),
      Purchase.countDocuments({ pharmacy: pharmacyId }),
      Prescription.countDocuments({ pharmacy: pharmacyId }),
    ]);

    console.log("\n========== TRANSACTION SEED COMPLETE ==========");
    console.log(`Sales: ${saleCount}`);
    console.log(`Purchases: ${purchaseCount}`);
    console.log(`Prescriptions: ${prescriptionCount}`);
    console.log(`Purchase unit cost used: KES ${PURCHASE_UNIT_COST}`);
    console.log("================================================");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedTransactions().catch((error) => {
  console.error("Transaction seed failed:", error);
  process.exitCode = 1;
});
