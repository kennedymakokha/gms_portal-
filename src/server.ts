import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import routes from './routes';
import bodyParser from 'body-parser';
import departmentRoutes from './routes/department';
import UserRoutes from './routes/user';
import ClinicRoutes from './routes/clinic';
import PatientRoutes from './routes/patient';
import VisitRoutes from './routes/visit';
import Drugroutes from './routes/drugs';
import Labroutes from './routes/labs';
import procedureroutes from './routes/procedure';
dotenv.config();

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

// Start
const start = async () => {
  await connectDB();
  app.listen(3000, '0.0.0.0', () => {
    // app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();