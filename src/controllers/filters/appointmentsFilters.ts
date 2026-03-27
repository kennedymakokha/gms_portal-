interface AppointmentFilterOptions {
  clinicId?: string;
  role?: string;
  search?: string;
  userId?: string; // 👈 pass doctorId here when role is doctor
}

export const buildAppointmentsFilter = ({
  clinicId,
  role,
  search,
  userId,
}: AppointmentFilterOptions) => {
  let statusFilter;

  if (role === 'admin'||'doctor') {
    statusFilter = { $in: ['scheduled', 'completed', 'cancelled', 'in-progress'] };
  } else {
    statusFilter = { $in: ['scheduled', 'in-progress'] };
  }

  const filter: any = {
    clinic: clinicId,
    status: statusFilter,
    deletedAt: null,
    $or: [{ isDeleted: false }, { isDeleted: null }],
  };

  // 👇 Role-based filtering
  if (role === 'doctor') {
    filter.doctorId = userId;
  }

  // 👇 Search filter
  if (search) {
    filter.$and = [
      {
        $or: [
          { doctorName: { $regex: search, $options: 'i' } },
          { patientName: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  return filter;
};