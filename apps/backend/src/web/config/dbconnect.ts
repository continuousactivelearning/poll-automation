// File: apps/backend/src/web/config/dbconnect.ts
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use environment variable or fallback to local MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/PollGenDb';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    // console.error('MongoDB connection error:', err);
    // process.exit(1);
    console.error('MongoDB connection error (continuing in dev):', err);
    // In development only: don't exit the process when MongoDB is unavailable.
    // This allows testing endpoints that don't require the DB (like OAuth redirects).
    // If you rely on the DB for critical flows, consider starting a local MongoDB instance
    // or updating MONGODB_URI to a reachable server.
  }
};

export default connectDB;