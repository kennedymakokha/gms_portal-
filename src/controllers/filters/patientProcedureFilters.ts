interface PatientProcedureFilterOptions {
  clinicId?: string;
  search?: string;
  status?: string;
}

export const buildPatientProcedureFilter = ({
  clinicId,
  search,
  status,
}: PatientProcedureFilterOptions) => {
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
      { procedureName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};
