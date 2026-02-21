interface LabFilterOptions {
  branchId?: string;
  visitId?: string;
  status?: string;
}

export const buildLabFilter = ({
  branchId,
  status,
}: LabFilterOptions) => {
  const filter: any = {
    branch: branchId,
  };

  if (status) {
    filter.status = status;
  }

  return filter;
};



export const buildLabFilterByVisit = ({
  branchId,
  status,
  visitId,
}: LabFilterOptions) => {
  const filter: any = {
    branch: branchId,visitId
  };

  if (status) {
    filter.status = status;
  }

  return filter;
};
