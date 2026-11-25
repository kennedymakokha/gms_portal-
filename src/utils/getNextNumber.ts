import Counter from "../models/CounterModel";
import mongoose from "mongoose";



export interface GetNextNumberOptions {
  base: string;
  pharmacyId?: string;
  branchId: string;
  clinicId?: string;
  pharmacyCode?: string;
  branchCode?: string;
  department?: string;
  session?: mongoose.ClientSession;
}

export async function getNextNumber({
  base,
  pharmacyId,
  clinicId,
  branchId,
  pharmacyCode,
  branchCode,
  department,
  session,
}: GetNextNumberOptions): Promise<string> {
  if (!pharmacyId || !branchId || !base) {
    throw new Error("pharmacyId, branchId and base are required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(pharmacyId) ||
    !mongoose.Types.ObjectId.isValid(branchId)
  ) {
    throw new Error("Invalid pharmacyId or branchId");
  }

  const year = new Date().getFullYear();

  const parts = [
    pharmacyCode?.trim().toUpperCase(),
    branchCode?.trim().toUpperCase(),
    base.trim().toUpperCase(),
  ].filter(Boolean) as string[];

  if (department?.trim()) {
    parts.push(department.trim().toUpperCase());
  }

  parts.push(String(year));

  const prefix = parts.join("-");

  const counter = await Counter.findOneAndUpdate(
    {
      pharmacy: new mongoose.Types.ObjectId(pharmacyId),
      branch: new mongoose.Types.ObjectId(branchId),
      key: prefix,
    },
    {
      $inc: { seq: 1 },
      $setOnInsert: {
        pharmacy: new mongoose.Types.ObjectId(pharmacyId),
        branch: new mongoose.Types.ObjectId(branchId),
        key: prefix,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

  if (!counter) {
    throw new Error("Failed to generate the next number");
  }

  return `${prefix}-${String(counter.seq).padStart(3, "0")}`;
}

// // Keep your existing abbreviation helper if it is already implemented.
// export const generateSmartAbbreviation = (value: string): string => {
//   return String(value || "")
//     .trim()
//     .split(/[\s_-]+/)
//     .filter(Boolean)
//     .map((word) => word.charAt(0).toUpperCase())
//     .join("");
// };


type PatientStatus =
  | "outpatient"
  | "admitted"
  | "critical"
  | "discharged";
export function generateSmartAbbreviation(name: string): string {
  if (!name) return '';

  const stopWords = ['and', 'of', 'the', 'for', 'in', 'at', 'to'];

  const words = name
    .trim()
    .split(/\s+/)
    .filter(word => !stopWords.includes(word.toLowerCase()));

  // If multiple meaningful words → take first letter of each
  if (words.length > 1) {
    return words.map(word => word[0].toUpperCase()).join('');
  }

  // If single word → take first 3 letters (or 2 if short)
  const word = words[0];
  return word.length <= 3
    ? word.toUpperCase()
    : word.slice(0, 3).toUpperCase();
}
export async function getNextNumberWithoutBranch({
  base,
  pharmacyId,
  department,
  session,
}: GetNextNumberOptions) {

  const prefix = department
    ? `${base}-${department}`
    : base;

  const counter = await Counter.findOneAndUpdate(
    { pharmacy: new mongoose.Types.ObjectId(pharmacyId), key: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  return `${prefix}-${String(counter!.seq).padStart(3, "0")}`;
}
