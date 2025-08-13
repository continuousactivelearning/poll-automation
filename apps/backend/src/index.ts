// apps/backend/src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http'; // NEW: Import createServer for HTTP server
import { Server as SocketIOServer } from 'socket.io'; // NEW: Import Socket.IO Server
import connectDB from './web/config/dbconnect';
import authRoutes from './web/routes/authRoutes';
import sessionRoutes from './web/routes/sessionRoutes';
import manualPollRoutes from './web/routes/manualPollRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Use 3000 as default if PORT is not set

// NEW: Create an HTTP server from the Express app
const httpServer = createServer(app);

// NEW: Initialize Socket.IO server
// Allow CORS for Socket.IO as well
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5174", // Allow your frontend origin
    methods: ["GET", "POST"]
  }
});

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Define a simple root route for testing if the server is running.
app.get('/', (req: Request, res: Response) => {
  res.send('AUTOMATIC_POLL_GENERATION Backend API is running!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/manual-polls', manualPollRoutes);

// NEW: Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // You can join rooms based on session ID here if needed
  // Example: socket.on('joinSession', (sessionId) => { socket.join(sessionId); });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io instance accessible globally or pass it to controllers
// This is a common pattern, though dependency injection is cleaner for larger apps.
// For now, we'll use a global export or pass it directly.
// Let's export it for now, and import it in the controller.
export { io }; // NEW: Export the io instance

// Start the HTTP server (which now includes Express and Socket.IO)
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server listening on port ${PORT}`);
});
