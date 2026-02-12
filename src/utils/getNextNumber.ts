import Counter from "../models/CounterModel";
import mongoose from "mongoose";

interface GetNextNumberOptions {
  base: string;
  clinicId: string;
  department?: string;
  session?: mongoose.ClientSession;
}

export async function getNextNumber({
  base,
  clinicId,
  department,
  session,
}: GetNextNumberOptions) {

  const prefix = department
    ? `${base}-${department}`
    : base;

  const counter = await Counter.findOneAndUpdate(
    { clinic: clinicId, key: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  return `${prefix}-${String(counter!.seq).padStart(3, "0")}`;
}

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
