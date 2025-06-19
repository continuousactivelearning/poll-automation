// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import audioRoutes from './routes/audio';
import authRoutes from './routes/auth';
import geminiService from './services/geminiService';

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003'
    ],
    methods: ['GET', 'POST']
  }
});

// Middleware - CORS configuration (Development mode - allow all origins)
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', (req, res) => {
  console.log(`🔄 OPTIONS request from ${req.headers.origin} to ${req.path}`);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

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
app.use('/api/auth', authRoutes);
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

  // Real-time audio streaming events
  socket.on('start-audio-stream', (data: any) => {
    const { meetingId, hostId } = data;
    socket.join(`audio-${meetingId}`);
    console.log(`Audio stream started for meeting ${meetingId} by host ${hostId}`);

    // Notify participants that audio streaming has started
    io.to(meetingId).emit('audio-stream-started', { hostId, timestamp: new Date().toISOString() });
  });

  socket.on('audio-chunk', async (data: any) => {
    const { meetingId, audioChunk, chunkIndex, timestamp } = data;
    console.log(`Received audio chunk ${chunkIndex} for meeting ${meetingId}`);

    // Real-time AI processing of audio chunk
    try {
      // Convert audio chunk back to buffer for processing
      const audioBuffer = Buffer.from(audioChunk);

      // Real-time AI processing with Gemini (free) or demo
      const partialTranscript = await processAudioChunkRealtime(audioBuffer, chunkIndex);

      // Send real-time results to all participants
      io.to(meetingId).emit('realtime-transcript-update', {
        chunkIndex,
        partialTranscript,
        timestamp,
        isPartial: true
      });

      // Check if we have enough chunks for a poll question
      if (chunkIndex > 0 && chunkIndex % 5 === 0) { // Every 5 seconds
        const realtimePoll = await generateRealtimePoll(partialTranscript, chunkIndex);
        io.to(meetingId).emit('realtime-poll-generated', {
          poll: realtimePoll,
          chunkIndex,
          timestamp
        });
      }

    } catch (error) {
      console.error('Real-time AI processing error:', error);
    }

    // Also relay to other participants for monitoring
    socket.to(`audio-${meetingId}`).emit('audio-chunk-received', {
      chunkIndex,
      timestamp,
      size: audioChunk.length
    });
  });

  socket.on('stop-audio-stream', (data: any) => {
    const { meetingId, hostId } = data;
    console.log(`Audio stream stopped for meeting ${meetingId}`);

    // Notify participants that audio streaming has stopped
    io.to(meetingId).emit('audio-stream-stopped', { hostId, timestamp: new Date().toISOString() });
    socket.leave(`audio-${meetingId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Real-time AI processing functions
async function processAudioChunkRealtime(audioBuffer: Buffer, chunkIndex: number): Promise<string> {
  // Try Gemini AI first, then fallback to demo
  if (geminiService.isAvailable()) {
    try {
      // For real-time processing, we'll use a simple analysis
      const demoContent = `Audio chunk ${chunkIndex + 1} received for processing`;
      const analysis = await geminiService.analyzeTranscriptChunk(demoContent, chunkIndex);
      console.log(`🤖 Gemini real-time analysis chunk ${chunkIndex}: "${analysis}"`);
      return analysis;
    } catch (error) {
      console.error('Gemini real-time processing error:', error);
      // Fall through to demo mode
    }
  }

  // Demo mode: simulate real-time transcription
  const demoTranscripts = [
    "Welcome to today's educational session on modern development.",
    "We'll be covering important concepts and practical applications.",
    "Let's start with the fundamental principles and best practices.",
    "Next, we'll explore advanced techniques and methodologies.",
    "These concepts are essential for understanding the topic.",
    "We'll also discuss implementation strategies and optimization.",
    "Error handling and performance considerations are crucial topics.",
    "Let's look at some practical examples and real-world use cases.",
    "Testing and validation ensure reliability and quality.",
    "Finally, we'll review deployment and maintenance strategies."
  ];

  const transcript = demoTranscripts[chunkIndex % demoTranscripts.length];
  console.log(`🎭 Demo transcript chunk ${chunkIndex}: "${transcript}"`);

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return transcript;
}

async function generateRealtimePoll(transcript: string, chunkIndex: number): Promise<any> {
  // Try Gemini AI first, then fallback to demo
  if (geminiService.isAvailable()) {
    try {
      const poll = await geminiService.generateContextualPoll(transcript, chunkIndex);
      console.log(`🤖 Gemini real-time poll generated at chunk ${chunkIndex}: "${poll.question}"`);
      return poll;
    } catch (error) {
      console.error('Gemini poll generation error:', error);
      // Fall through to demo mode
    }
  }

  // Demo mode: generate contextual poll questions
  const demoPolls = [
    {
      question: "What is the primary focus of this educational session?",
      options: ["Theory only", "Practical application", "Historical context", "Future predictions"],
      correctAnswer: 1,
      difficulty: "Easy",
      category: "General",
      explanation: "The session focuses on practical application of concepts."
    },
    {
      question: "Why are best practices important in development?",
      options: ["They're trendy", "They ensure quality", "They're required by law", "They're optional"],
      correctAnswer: 1,
      difficulty: "Medium",
      category: "Best Practices",
      explanation: "Best practices help ensure quality and consistency in implementation."
    },
    {
      question: "What should be prioritized in implementation?",
      options: ["Speed only", "Quality and reliability", "Cost reduction", "Feature quantity"],
      correctAnswer: 1,
      difficulty: "Medium",
      category: "Implementation",
      explanation: "Quality and reliability should be prioritized for long-term success."
    },
    {
      question: "How important is error handling in applications?",
      options: ["Not important", "Critical for reliability", "Only for production", "Optional feature"],
      correctAnswer: 1,
      difficulty: "Easy",
      category: "Error Handling",
      explanation: "Proper error handling is critical for application reliability and user experience."
    },
    {
      question: "What makes testing valuable in development?",
      options: ["It's required", "Ensures code quality", "Slows development", "Increases complexity"],
      correctAnswer: 1,
      difficulty: "Medium",
      category: "Testing",
      explanation: "Testing ensures code quality and helps catch issues early in development."
    }
  ];

  const poll = demoPolls[chunkIndex % demoPolls.length];
  console.log(`🎭 Demo poll generated at chunk ${chunkIndex}: "${poll.question}"`);

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 200));

  return poll;
}

// Start server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🎵 Real-time Audio & AI Processing enabled`);
  console.log(`📡 WebSocket streaming ready for live audio chunks`);
  console.log(`🤖 AI poll generation every 5 seconds during recording`);

  // Show AI service status
  const geminiStatus = geminiService.getStatus();
  if (geminiStatus.available) {
    console.log(`🆓 Gemini AI service active (${geminiStatus.model})`);
  } else {
    console.log(`🎭 Running in demo mode - Add GEMINI_API_KEY for free AI processing`);
  }
});


