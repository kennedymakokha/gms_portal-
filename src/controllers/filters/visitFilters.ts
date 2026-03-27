interface VisitFilterOptions {
  branchId?: string;
  track?: string;
  role?:string
  userId?:string
}

export const buildVisitFilter = ({
  branchId,
  track,
  role,
  userId
}: VisitFilterOptions) => {
  const billingTracks = ['reg_billing', 'lab_billing', 'med_billing'];

  const filter: any = {
    branch: branchId,
  };
  if (role === 'doctor') {
    filter.assignedDoctor = userId;
  }

  if (track === 'billing') {
    filter.track = { $in: billingTracks };
  } else if (track) {
    filter.track = track;
  }

  return filter;
};
