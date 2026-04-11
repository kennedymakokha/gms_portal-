import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { setupSocket } from './config/socket';
import { connectDB } from "./config/db";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from 'cors';
import path from "path";

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
import paymentsCareRoute from './routes/tasks';
import appointmentsRoute from './routes/appointments';

const dev = process.env.NODE_ENV !== 'production';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://marapesa.com",
  "https://smartshop-api.marapesa.com",
  "http://185.113.249.137:3000",
  "https://api.marapesa.com",
  "https://a899-102-205-188-82.ngrok-free.app"
];

const io = new IOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});



app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / mobile apps

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = Number(process.env.PORT) || 5000;

connectDB();

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
app.use('/api', paymentsCareRoute);
app.use('/api', appointmentsRoute);
app.get("/", (req, res) => {
  res.send("WebSocket Server is running!");
  return
});
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

setupSocket(io);
