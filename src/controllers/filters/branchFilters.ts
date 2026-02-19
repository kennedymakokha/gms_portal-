interface BranchFilterOptions {
  search?: string;
}

export const buildBranchFilter = ({ search }: BranchFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
  };

  if (search) {
    filter.branchName = { $regex: search, $options: 'i' };
    filter.uuid = { $regex: search, $options: 'i' };
  }

  return filter;
};
