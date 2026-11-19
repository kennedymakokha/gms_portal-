
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET || "development_secret_key_change_in_prod";

const REFRESH_SECRET =
  process.env.REFRESH_SECRET || "development_secret_key_change_in_prod";

const generateTokens = (user: any) => {
  const pharmacyId = user.pharmacy?._id
    ? user.pharmacy._id.toString()
    : user.pharmacy?.toString();

  const branchId = user.branch?._id
    ? user.branch._id.toString()
    : user.branch?.toString();

  const clinicId = user.branch?.clinic?._id
    ? user.branch.clinic._id.toString()
    : user.branch?.clinic?.toString();

  const accessToken = jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      username: user.name,
      pharmacyId,
      branchId,
      clinicId,
      inpatient: user.branch?.inpatient,
    },
    JWT_SECRET,
    { expiresIn: "14d" }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id.toString(),
      pharmacyId,
      branchId,
      clinicId,
    },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export default generateTokens;
