import mongoose from 'mongoose';

const MONGO_URI:any = process.env.MONGO_URI ;

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log(' MongoDB Connected');
  } catch (error) {
    console.error(' Database Connection Failed:', error);
    process.exit(1);
  }
};