interface VisitFilterOptions {
  branchId?: string;
  track?: string;
}

export const buildVisitFilter = ({
  branchId,
  track,
}: VisitFilterOptions) => {
  const billingTracks = ['reg_billing', 'lab_billing', 'med_billing'];

  const filter: any = {
    branch: branchId,
  };

  if (track === 'billing') {
    filter.track = { $in: billingTracks };
  } else if (track) {
    filter.track = track;
  }

  return filter;
};
