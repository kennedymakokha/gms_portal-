interface VisitFilterOptions {
  clinicId?: string;
  track?: string;
}

export const buildVisitFilter = ({
  clinicId,
  track,
}: VisitFilterOptions) => {
  const billingTracks = ['reg_billing', 'lab_billing', 'med_billing'];

  const filter: any = {
    clinic: clinicId,
  };

  if (track === 'billing') {
    filter.track = { $in: billingTracks };
  } else if (track) {
    filter.track = track;
  }

  return filter;
};
