interface ClinicFilterOptions {
  search?: string;
}

export const buildClinicFilter = ({ search }: ClinicFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
  };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  return filter;
};
