import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      clinicId: user.clinic?._id // ✅ include clinicId here
    },
    process.env.JWT_SECRET || "development_secret_key_change_in_prod",
    { expiresIn: "14d" } // Short expiration
  );

  const refreshToken = jwt.sign(
    { userId: user._id, clinicId: user.clinic?._id }, // optional clinicId here too
    process.env.REFRESH_SECRET || "development_secret_key_change_in_prod",
    { expiresIn: "7d" } // Usually refresh tokens last longer
  );

  return { accessToken, refreshToken };
};

export default generateTokens;
