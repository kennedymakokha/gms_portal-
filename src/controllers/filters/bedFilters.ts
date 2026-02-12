interface BedFilterOptions {
  clinicId?: string;
  role?: string;
  search?: string;
}

export const buildBedFilter = ({
  clinicId,
  role,
  search,
}: BedFilterOptions) => {
  const statusFilter =
    role === 'admin'
      ? { $in: ['available', 'occupied', 'maintenance', 'reserved'] }
      : { $in: ['available', 'reserved'] };

  const filter: any = {
    clinic: clinicId,
    status: statusFilter,
    deletedAt: null,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  if (search) {
    filter.$and = [
      {
        $or: [
          { bedNumber: { $regex: search, $options: 'i' } },
          { ward: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  return filter;
};
