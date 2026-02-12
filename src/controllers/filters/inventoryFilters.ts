interface InventoryFilterOptions {
  search?: string;
  clinicId?: string; // optional if inventory is clinic-specific
}

export const buildInventoryFilter = ({ search, clinicId }: InventoryFilterOptions) => {
  const filter: any = {
    deletedAt: null,
  };

  if (clinicId) {
    filter.clinic = clinicId;
  }

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  return filter;
};
