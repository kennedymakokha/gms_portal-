interface HistoryFilterOptions {
  clinicId?: string;
  search?: string;
  status?: string;
}

export const buildHistoryFilter = ({
  clinicId,
  search,
  status,
}: HistoryFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
  };

  if (clinicId) {
    filter.clinic = clinicId;
  }

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
