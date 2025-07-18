// apps/backend/src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './web/config/dbconnect'; // Import the DB connection function
import authRoutes from './web/routes/authRoutes'; // Import authentication routes
import sessionRoutes from './web/routes/sessionRoutes'; // *** NEW: Import session routes ***

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT; // Use port from .env 

// Connect to Database
// This function will be called when the server starts to establish MongoDB connection.
connectDB();

// Middleware
// Enable CORS for all origins. In production, you should restrict this to your frontend's domain.
app.use(cors());
// Body parser for JSON requests. This allows Express to read JSON data sent in the request body.
app.use(express.json());

// Define a simple root route for testing if the server is running.
app.get('/', (req: Request, res: Response) => {
  res.send('AUTOMATIC_POLL_GENERATION Backend API is running!');
});

// API Routes
// Mount the authentication routes under the /api/auth path.
// All routes defined in authRoutes (e.g., /register, /login) will now be accessible
// at /api/auth/register and /api/auth/login.
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes); // *** NEW: Mount the session routes ***


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});
