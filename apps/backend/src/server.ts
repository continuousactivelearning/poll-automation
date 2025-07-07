import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import { setupWebSocketServer } from './websocket/connection';
import app from './app';
import connectDB from './web/config/db';
import http from 'http';
import { initializeStudentSocket } from './websocket/studentWebSocket';
import { mongoPollingWatcher } from './services/mongoPollingWatcher';

const PORT = process.env.PORT || 3001; // Changed from 5003 to 3001 to match .env
const server = http.createServer(app);

// setupWebSocketServer(server);

// connectDB().then(() => {
//   server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// });

const start = async () => {
  await connectDB();

  initializeStudentSocket(server); // <-- start WebSocket server

  // Start MongoDB polling watcher after connection is established
  setTimeout(() => {
    mongoPollingWatcher.startWatching();
  }, 1000);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();
