interface MedicineFilterOptions {
  
  search?: string;
}

export const buildMedicineFilter = ({  search }: MedicineFilterOptions) => {
  const filter: any = {
    deletedAt: null,
    isDeleted: false,
   
  };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  return filter;
};
