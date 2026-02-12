interface LabFilterOptions {
  clinicId?: string;
  status?: string;
}

export const buildLabFilter = ({
  clinicId,
  status,
}: LabFilterOptions) => {
  const filter: any = {
    clinic: clinicId,
  };

  if (status) {
    filter.status = status;
  }

  return filter;
};
