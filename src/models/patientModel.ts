import { Schema, model, Types, HydratedDocument, Query } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPatient {
  uuid: string;
  name: string;
  dob: string;
  sex: "Male" | "Female" | "Other";

  phone?: string;
  guardianphone?: string;
  nationalId?: string;
  password: string;

  nokName?: string;
  nokRelationship?: string;
  nokPhone?: string;

  status?: "outpatient" | "admitted" | "critical" | "discharged";
  bloodgroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  room?: string;
  history?: string;

  track:
    | "registered"
    | "reg_billing"
    | "lab"
    | "lab_billing"
    | "med_billing"
    | "ward_billing"
    | "triage"
    | "pre-lab"
    | "post-lab"
    | "pharmecy"
    | "admitted";

  created_by?: Types.ObjectId;
  clinic?: Types.ObjectId;
  address?: string;

  admissionDate: Date | null;

  isDeleted: boolean;
  deletedAt?: Date | null;
  visits?: Types.ObjectId[];
}

const PatientSchema = new Schema<IPatient>(
  {
    uuid: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true, trim: true },

    bloodgroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O-", "O+"],
    },

    room: { type: String },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    track: { type: String, default: "reg_billing" },

    admissionDate: { type: Date, default: null },

    visits: [{ type: Schema.Types.ObjectId, ref: "Visits" }],

    status: {
      type: String,
      enum: ["outpatient", "admitted", "critical", "discharged"],
      default: "outpatient",
      required: true,
    },

    dob: { type: String, required: true },

    sex: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    phone: { type: String },
    guardianphone: { type: String },
    nationalId: { type: String },
    nokName: { type: String },
    nokRelationship: { type: String },
    nokPhone: { type: String },
    history: { type: String },
    address: { type: String },

    created_by: { type: Schema.Types.ObjectId, ref: "User" },

    clinic: {
      type: Schema.Types.ObjectId,
      ref: "clinic",
      index: true,
    },

    isDeleted: { type: Boolean, default: false, index: true },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

//
// 🔐 HASH PASSWORD BEFORE SAVE
//
PatientSchema.pre("save", async function (this: HydratedDocument<IPatient>) {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

//
// 🔐 HASH PASSWORD ON UPDATE
//
PatientSchema.pre("findOneAndUpdate", async function () {
  const update: any = this.getUpdate();
  if (!update?.password) return;

  const salt = await bcrypt.genSalt(12);
  update.password = await bcrypt.hash(update.password, salt);

  this.setUpdate(update);
});

//
// 👶 REQUIRE GUARDIAN IF UNDER 18
//
PatientSchema.pre("validate", function (this: HydratedDocument<IPatient>) {
  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const age = calculateAge(this.dob);

  if (age < 18 && !this.guardianphone) {
    throw new Error(
      "Guardian phone number is required for patients under 18"
    );
  }
});

//
// 🗑 AUTO FILTER SOFT-DELETED RECORDS
//
PatientSchema.pre(
  /^find/,
  function (this: Query<any, IPatient>) {
    this.where({ isDeleted: false });
  }
);

//
// 🧹 CLEAN JSON OUTPUT
PatientSchema.set("toJSON", {
  transform: function (_doc, ret: any) {
    const { password, __v, ...cleaned } = ret;
    return cleaned;
  },
});



//
// 🔑 PASSWORD COMPARISON METHOD
//
PatientSchema.methods.comparePassword = async function (
  candidate: string
) {
  return bcrypt.compare(candidate, this.password);
};

//
// 🔎 TEXT SEARCH INDEX
//
PatientSchema.index({
  name: "text",
  phone: "text",
});

export default model<IPatient>("Patient", PatientSchema);
