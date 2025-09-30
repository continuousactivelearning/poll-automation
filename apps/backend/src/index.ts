// apps/backend/src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './web/config/dbconnect';
import authRoutes from './web/routes/authRoutes';
import sessionRoutes from './web/routes/sessionRoutes';
import manualPollRoutes from './web/routes/manualPollRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// NEW: Create an HTTP server from the Express app
const httpServer = createServer(app);

// FIX 1: Initialize Socket.IO server with CORS credentials set to true
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5174", // Allow your frontend origin
    methods: ["GET", "POST"],
    credentials: true // FIX: Crucial for development to allow auth/cookies
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

// FIX 2: Socket.IO connection handling Logic with room joining
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle client joining a specific session room
  socket.on('joinSessionRoom', (roomCode: string) => {
    if (roomCode) {
      const room = roomCode.toUpperCase();
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});


// Make io instance accessible globally or pass it to controllers
export { io }; // Export the io instance

// Start the HTTP server (which now includes Express and Socket.IO)
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server listening on port ${PORT}`);
});