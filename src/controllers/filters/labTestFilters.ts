interface LabFilterOptions {
  branchId?: string;
  search?: string;
  role?: string;
  status?: string;
}

export const buildLabTestFilter = ({ branchId, search, role, status }: LabFilterOptions) => {
  const statusFilter =
    role === "admin"
      ? { $in: ["active", "inactive"] }
      : "active";

  const filter: any = {
    branch: branchId,
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
