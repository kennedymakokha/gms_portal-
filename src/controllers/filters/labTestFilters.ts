interface LabFilterOptions {
  clinicId?: string;
  search?: string;
  role?: string;
  status?: string;
}

export const buildLabTestFilter = ({ clinicId, search, role, status }: LabFilterOptions) => {
  const statusFilter =
    role === "admin"
      ? { $in: ["active", "inactive"] }
      : "active";

  const filter: any = {
    clinic: clinicId,
    status: status || statusFilter,
    deletedAt: null,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  if (search) {
    filter.$and = [
      {
        $or: [
          { testName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  return filter;
};
