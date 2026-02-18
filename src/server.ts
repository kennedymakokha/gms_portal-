import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import routes from './routes';
import bodyParser from 'body-parser';

import { execFile } from 'child_process';

import departmentRoutes from './routes/department';
import UserRoutes from './routes/user';
import ClinicRoutes from './routes/clinic';
import PatientRoutes from './routes/patient';
import VisitRoutes from './routes/visit';
import Drugroutes from './routes/drugs';
import Bedroutes from './routes/beds';
import Labroutes from './routes/labs';
import procedureroutes from './routes/procedure';
import patientHisory from './routes/patientHistory';
import patientLabResults from './routes/patientLabResults';
import patientProcedures from './routes/patientProcedures';
import patientMedications from './routes/patientMedication';
import wardsRoute from './routes/wards';
import paymentsRoute from './routes/payments';
import { runScanner } from './utils/runscaner';
dotenv.config();
const scannerPath = "/home/user/Downloads/FDx_SDK_Pro_Linux_v4.0c/FDx SDK Pro for Linux v4.0c/FDx_SDK_PRO_LINUX4_X64_4_0_0/bin/linux4X64/sgfplibtest";

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Routes
// app.use('/api', routes);
app.use('/api', departmentRoutes);
app.use('/api', UserRoutes);
app.use('/api', ClinicRoutes);
app.use('/api', PatientRoutes);
app.use('/api', VisitRoutes);
app.use('/api', Drugroutes);
app.use('/api', Labroutes);
app.use('/api', procedureroutes);
app.use('/api', patientHisory);
app.use('/api', patientLabResults);
app.use('/api', patientProcedures);
app.use('/api', patientMedications);
app.use('/api', Bedroutes);
app.use('/api', wardsRoute);
app.use('/api', paymentsRoute);





app.post("/scan", async (req, res) => {
  try {
    const result = await runScanner();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: "Fingerprint captured",
      templateSize: result.template_size,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});




// Start
const start = async () => {
  await connectDB();
  app.listen(3000, '0.0.0.0', () => {
    // app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();