interface DepartmentFilterOptions {
  branchId?: string;
  search?: string;
}

export const buildDepartmentFilter = ({ branchId, search }: DepartmentFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
    branch: branchId,
  };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  return filter;
};
