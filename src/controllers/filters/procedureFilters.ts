interface ProcedureFilterOptions {
  clinicId?: string;
  search?: string;
  role?: string;
  status?: string;
}

export const buildProcedureFilter = ({
  clinicId,
  search,
  role,
  status,
}: ProcedureFilterOptions) => {
  const statusFilter =
    role === "admin"
      ? { $in: ["active", "inactive"] }
      : "active";

  const filter: any = {
    clinic: clinicId,
    deletedAt: null,
    status: status || statusFilter,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  if (search) {
    filter.$and = [
      {
        $or: [
          { procedureName: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  return filter;
};
