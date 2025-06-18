import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import audioRoutes from './routes/audio';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/poll-generation';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Poll Generation API is running');
});

// API Routes
app.use('/api/audio', audioRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a meeting room
  socket.on('join-meeting', (meetingId: string) => {
    socket.join(meetingId);
    console.log(`User ${socket.id} joined meeting ${meetingId}`);
  });

  // Leave a meeting room
  socket.on('leave-meeting', (meetingId: string) => {
    socket.leave(meetingId);
    console.log(`User ${socket.id} left meeting ${meetingId}`);
  });

  // Host launches a poll
  socket.on('launch-poll', (data: any) => {
    const { meetingId, poll } = data;
    io.to(meetingId).emit('new-poll', poll);
    console.log(`New poll launched in meeting ${meetingId}`);
  });

  // Participant submits an answer
  socket.on('submit-answer', (data: any) => {
    const { meetingId, userId, pollId, answer } = data;
    // In a real app, you would save this to the database

    // Notify the host about the new response
    io.to(meetingId).emit('poll-response', { userId, pollId, answer });
    console.log(`Answer submitted for poll ${pollId} in meeting ${meetingId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


