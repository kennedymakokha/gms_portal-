interface PatientFilterOptions {
  clinicId?: string;
  search?: string;
  status?: string;
  track?: string;
}

export const buildPatientFilter = ({
  clinicId,
  search,
  status,
  track,
}: PatientFilterOptions) => {
  const filter: any = {
    clinic: clinicId,
    deletedAt: null,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  // 🔎 Search
  if (search) {
    filter.$and = [
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { nationalId: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  // 📌 Status
  if (status) {
    filter.status = status;
  }

  // 💰 Track / Billing
  if (track) {
    const billingTracks = ['reg_billing', 'lab_billing', 'med_billing'];

    if (track === 'billing') {
      filter.track = { $in: billingTracks };
    } else {
      filter.track = track;
    }
  }

  return filter;
};
