interface CategoryFilterOptions {
  
  search?: string;
}

export const buildCategoryFilter = ({  search }: CategoryFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
   
  };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  return filter;
};
