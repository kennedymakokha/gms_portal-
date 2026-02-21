import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
      username:user.name,
      branchId: user.branch?._id,
      clinicId: user.branch?.clinic?._id,
      inpatient: user.branch?.inpatient, // 👈 useful for frontend
    },
   process.env.JWT_SECRET || "development_secret_key_change_in_prod",
    { expiresIn: "14d" }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id,
      branchId: user.branch?._id,
      clinicId: user.branch?.clinic?._id,

    },
   process.env.REFRESH_SECRET || "development_secret_key_change_in_prod",
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};



export default generateTokens;
