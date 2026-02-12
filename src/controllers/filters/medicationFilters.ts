interface MedicationFilterOptions {
  clinicId?: string;
  search?: string;
  status?: string;
}

export const buildMedicationFilter = ({
  clinicId,
  search,
  status,
}: MedicationFilterOptions) => {
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
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};
