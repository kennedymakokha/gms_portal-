interface DrugFilterOptions {
  clinicId?: string;
  search?: string;
}

export const buildDrugFilter = ({ clinicId, search }: DrugFilterOptions) => {
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
