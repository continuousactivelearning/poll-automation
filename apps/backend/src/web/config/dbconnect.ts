import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://devuser1:test1234@cluster0.g6xtlxf.mongodb.net/auth_db?retryWrites=true&w=majority&appName=Cluster0',
};

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
