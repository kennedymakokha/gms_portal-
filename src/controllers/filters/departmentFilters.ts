interface DepartmentFilterOptions {
  clinicId?: string;
  search?: string;
}

export const buildDepartmentFilter = ({ clinicId, search }: DepartmentFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
    clinic: clinicId,
  };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  return filter;
};
