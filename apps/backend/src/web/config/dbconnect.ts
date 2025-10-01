// File: apps/backend/src/web/config/dbconnect.ts
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use environment variable or fallback to local MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/PollGenDb';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;