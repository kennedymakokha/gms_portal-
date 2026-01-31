import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// export enum UserRole {
//   ADMIN = 'ADMIN',
//   MECHANIC = 'MECHANIC',
//   CLERK = 'CLERK'
// }
export enum UserRole {
  admin = 'admin',
  doctor = 'doctor',
  nurse = 'nurse',
  receptionist = 'receptionist'
}
// = 'admin' | 'doctor' | 'nurse' | 'receptionist';
export interface IUser extends Document {
  name: string;
  phone_number: string;
  password: string;
  role: UserRole;
  uuid: string
  department?: string;
  createdBy?: Schema.Types.ObjectId;
  clinic?: Schema.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date | null;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  phone_number: { type: String, required: true, },
  password: { type: String, required: true },
  uuid: { type: String, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  clinic: { type: Schema.Types.ObjectId, ref: 'clinic' },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  department: {
    type: String,

  },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.nurse },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});
// UserSchema.pre('save', async function (this: IUser) {
//   if (!this.isModified('passwordHash')) return;

//   this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
// });

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export default model<IUser>('User', UserSchema);