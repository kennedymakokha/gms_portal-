
import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
  admin = "admin",
  doctor = "doctor",
  nurse = "nurse",
  receptionist = "receptionist",
  pharmacist = "pharmacist",
  patient = "patient",
  lab_tech = "lab_tech",
  finance = "finance",
}

export interface IUser extends Document {
  name: string;
  phone_number: string;
  username: string;
  pharmacy?: Types.ObjectId;
  password: string;
  role: UserRole;
  uuid: string;
  department?: Types.ObjectId;
  beneficiaries?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  branch?: Types.ObjectId;
  email?: string;
  specialty?: string;
  status: "active" | "on-leave" | "inactive";
  experience?: number;
  qualification?: string;
  avatar?: string;
  schedule?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone_number: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    beneficiaries: [
      {
        type: Schema.Types.ObjectId,
        ref: "tb_user",
      },
    ],

    qualification: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
    },

    schedule: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "on-leave", "inactive"],
      default: "active",
    },

    uuid: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "tb_user",
    },

    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
    },

    branch: {
      type: Schema.Types.ObjectId,
      ref: "branch",
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.pharmacist,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Unique phone number within each active pharmacy
UserSchema.index(
  { pharmacy: 1, phone_number: 1 },
  {
    unique: true,
    partialFilterExpression: {
      pharmacy: { $exists: true },
      isDeleted: false,
    },
  }
);

// Unique email within each active pharmacy
UserSchema.index(
  { pharmacy: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      pharmacy: { $exists: true },
      email: { $type: "string" },
      isDeleted: false,
    },
  }
);

// Unique UUID within each active pharmacy
UserSchema.index(
  { pharmacy: 1, uuid: 1 },
  {
    unique: true,
    partialFilterExpression: {
      pharmacy: { $exists: true },
      uuid: { $type: "string" },
      isDeleted: false,
    },
  }
);

// Pharmacy user listing
UserSchema.index({
  pharmacy: 1,
  isDeleted: 1,
  createdAt: -1,
});

export default model<IUser>("tb_user", UserSchema);
