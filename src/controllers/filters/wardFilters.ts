interface WardFilterOptions {
  clinicId?: string;
  search?: string;
  role?: string;
  status?: string | string[];
}

export const buildWardFilter = ({
  clinicId,
  search,
  role,
  status,
}: WardFilterOptions) => {
  const statusFilter =
    status ||
    (role === "admin"
      ? { $in: ["available", "occupied", "maintenance", "reserved"] }
      : { $in: ["available", "reserved"] });

  const filter: any = {
    clinic: clinicId,
    status: statusFilter,
    deletedAt: null,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  if (search) {
    filter.$and = [
      {
        $or: [{ wardName: { $regex: search, $options: "i" } }],
      },
    ];
  }

  return filter;
};
