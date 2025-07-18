// apps/backend/src/web/config/dbconnect.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from the .env file.
// This ensures that process.env.MONGO_URI is available.
dotenv.config();

/**
 * Establishes a connection to the MongoDB database.
 * The MongoDB URI is fetched from the environment variables (MONGO_URI).
 * If the connection fails, the process will exit.
 */
const connectDB = async () => {
  try {
    // Retrieve the MongoDB URI from environment variables.
    const mongoURI = process.env.MONGO_URI;

    // Check if MONGO_URI is defined. If not, log an error and exit.
    if (!mongoURI) {
      console.error('Error: MongoDB URI is not defined in environment variables. Please set MONGO_URI in your .env file.');
      process.exit(1); // Exit the process with a failure code
    }

    // Attempt to connect to MongoDB using the retrieved URI.
    // The `conn` object contains information about the connection.
    const conn = await mongoose.connect(mongoURI);

    // Log a success message including the host to which MongoDB is connected.
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err: any) {
    // Catch any errors during the connection attempt.
    // Log the error message and exit the process.
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1); // Exit the process with a failure code
  }
};

export default connectDB;
