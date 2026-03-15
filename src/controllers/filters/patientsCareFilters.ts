interface PatientsCareFilterOptions {
  clinicId?: string;
  branchId?: string;
  status?: string;
  search?: string;
}

export const buildPatientsCareFilter = ({
  clinicId,
  status,
  branchId,
  search,
}: PatientsCareFilterOptions) => {

  const filter: any = {
    branch: branchId,
    status: status,
    deletedAt: null,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  if (search) {
    filter.$and = [
      {
        $or: [
          { patientName: { $regex: search, $options: 'i' } },
         
        ],
      },
    ];
  }

  return filter;
};
