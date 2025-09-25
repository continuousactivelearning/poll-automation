import express from 'express';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import both WebSocket systems
import { setupWebSocketServer } from './ws/ws-server';
import { initializeStudentSocket } from './websocket/studentWebSocket';

// Import routing and database
import app from './app';
import connectDB from './web/config/db';
import { mongoPollingWatcher } from './services/mongoPollingWatcher';

const PORT = process.env.BACKEND_HTTP_PORT || process.env.PORT || 3000;
const server = http.createServer(app);

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('📀 Database connected successfully');

    // Initialize your Socket.IO system for poll management (port 3000)
    initializeStudentSocket(server);
    console.log('🔌 Socket.IO (Poll Management) initialized on port 3000');

    // Initialize AI team's WebSocket for transcription (port 3001) - separate server
    setupWebSocketServer();
    console.log('🔌 AI WebSocket (Transcription) initialized on port 3001');

    // Start MongoDB polling watcher after connection is established
    setTimeout(() => {
      mongoPollingWatcher.startWatching();
      console.log('👀 MongoDB polling watcher started');
    }, 1000);

    server.listen(PORT, () => {
      console.log(`🚀 Integrated Server running successfully!`);
      console.log(`📡 Socket.IO (Polls): http://localhost:${PORT}/socket.io/`);
      console.log(
        `� WebSocket (Transcription): ws://localhost:3001/transcription`
      );
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

start();
