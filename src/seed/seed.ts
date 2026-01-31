import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/userModel';
import Department from '../models/deptModel';
import Job from '../models/jobModel';
import { connectDB } from '../config/db';

dotenv.config();

const seed = async () => {
  console.log('🌱 Starting Seeding Process...');
  await connectDB();

  try {
    const deptData = [
      { name: 'Management', code: 'MGMT', description: 'Administration' },
      { name: 'Front Desk', code: 'FDSK', description: 'Customer Service' },
      { name: 'Engine Repair', code: 'ENG', description: 'Engine Diagnostics & Repair' },
      { name: 'Transmission', code: 'TRANS', description: 'Transmission Specialists' },
      { name: 'Electrical', code: 'ELEC', description: 'Auto-Electrical Systems' },
      { name: 'Body Work', code: 'BODY', description: 'Denting & Painting' }
    ];

    console.log('🔹 Seeding Departments...');
    const deptMap = new Map();

    for (const d of deptData) {
      const dept = await Department.findOneAndUpdate(
        { code: d.code },
        d,
        { upsert: true, new: true }
      );
      deptMap.set(d.code, dept._id);
      console.log(`   - ${d.name} (${d.code})`);
    }

    console.log('🔹 Seeding Users...');
    const userData = [
      { name: 'Garage Admin', phone_number: '0700000000', password: 'admin123', role: UserRole.admin, departmentCode: 'MGMT' },
      { name: 'Clarissa Clerk', phone_number: '0700000001', password: 'clerk123', role: UserRole.CLERK, departmentCode: 'FDSK' },
      { name: 'Mike Engine', phone_number: '0700000002', role: UserRole.MECHANIC, departmentCode: 'ENG' },
      { name: 'Tom Trans', phone_number: '0700000003', role: UserRole.MECHANIC, departmentCode: 'TRANS' }
    ];

    for (const u of userData) {
      const exists = await User.findOne({ phone_number: u.phone_number });
      if (!exists) {
        await User.create({
          name: u.name,
          phone_number: u.phone_number,
          passwordHash: u.password || 'mechanic123',
          role: u.role,
          department: deptMap.get(u.departmentCode)
        });
        console.log(`    Created ${u.role}: ${u.phone_number}`);
      }
    }

    console.log('🔹 Seeding Sample Jobs...');
    const sampleJobs = [
      { vehicleReg: 'ABC-123', customerName: 'John Doe', description: 'Oil Leak Check', deptCode: 'ENG' },
      { vehicleReg: 'XYZ-789', customerName: 'Jane Smith', description: 'Gear Slipping', deptCode: 'TRANS' }
    ];

    for (const j of sampleJobs) {
      const exists = await Job.findOne({ vehicleReg: j.vehicleReg });
      if (!exists) {
        await Job.create({
          vehicleReg: j.vehicleReg,
          customerName: j.customerName,
          description: j.description,
          department: deptMap.get(j.deptCode),
          status: 'PENDING'
        });
        console.log(`    Created Job: ${j.vehicleReg} for ${j.deptCode}`);
      }
    }

  } catch (error) {
    console.error(' Error seeding:', error);
  } finally {
    console.log('🏁 Seeding Complete.');
    mongoose.disconnect();
    process.exit(0);
  }
};
seed();