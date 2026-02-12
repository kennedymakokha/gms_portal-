interface JobFilterOptions {
  clinicId?: string;
  search?: string;
  status?: string;
}

export const buildJobFilter = ({ clinicId, search, status }: JobFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    clinicId,
  };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};
