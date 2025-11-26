// File: apps/backend/src/index.ts
import http from "http";
import app from "./app";
import connectDB from "./web/config/dbconnect";
import { Server } from 'socket.io';
import { setupWebSocket } from './websocket/setup';
import ASRWebSocketServer from './websocket/asrHandler';
import ServiceManager from './services/serviceManager';
import { achievementTracker } from './services/achievementTracker';

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

// Initialize Socket.IO and attach it to the HTTP server
// Enhanced CORS configuration for Socket.IO matching Express app
const allowedOrigins = [
  'http://localhost:5174',              // Local development frontend
  'http://localhost:3000',              // Alternative local port
  'https://automatic-poll-generation-frontend.vercel.app', // Explicit production frontend
  process.env.FRONTEND_URL_LOCAL,       // Local frontend URL
  process.env.FRONTEND_URL_PROD,        // Production frontend URL
  process.env.FRONTEND_URL_PRODUCTION,  // Alternative production frontend URL
  ...(process.env.CORS_ORIGINS?.split(',') || [])  // Additional origins from env
].filter(Boolean); // Remove undefined/null values

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            // Check if origin is in allowed list
            if (allowedOrigins.some(allowedOrigin => 
                allowedOrigin && (origin === allowedOrigin || origin.includes(allowedOrigin))
            )) {
                return callback(null, true);
            }
            
            // For development, allow any localhost
            if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
                return callback(null, true);
            }
            
            return callback(new Error('Not allowed by CORS'), false);
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});
setupWebSocket(io);

// Initialize services with Socket.IO instance
ServiceManager.getInstance().initializeServices(io);

// Initialize Achievement Tracker with Socket.IO
achievementTracker.initialize(io);
console.log('🏆 Real-time Achievement System enabled');

// Initialize ASR WebSocket Server
const asrServer = new ASRWebSocketServer(server);

// Start the server after connecting to the database
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(` Server is running on http://localhost:${PORT}`);
            console.log(`🎙️ ASR WebSocket available at ws://localhost:${PORT}/ws/asr`);
        });
    } catch (error) {
        console.error(" Failed to start server:", error);
        process.exit(1);
    }
};

startServer();