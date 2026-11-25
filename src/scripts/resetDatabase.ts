
import "dotenv/config";
import mongoose from "mongoose";
import readline from "readline";

const resetDatabase = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }

  if (process.env.RESET_DATABASE !== "true") {
    throw new Error(
      "Database reset disabled. Set RESET_DATABASE=true to continue."
    );
  }

  await mongoose.connect(uri);

  try {
    const dbName = mongoose.connection.name;

    console.log("\n==================================");
    console.log("DATABASE RESET");
    console.log("==================================");
    console.log(`Database: ${dbName}`);
    console.log("All collections and records will be deleted.");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        `Type DROP ${dbName} to confirm: `,
        resolve
      );
    });

    rl.close();

    if (answer !== `DROP ${dbName}`) {
      console.log("Database reset cancelled.");
      return;
    }

    await mongoose.connection.dropDatabase();

    console.log("Database successfully dropped.");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

resetDatabase().catch((error) => {
  console.error("Database reset failed:", error);
  process.exitCode = 1;
});
