// File: apps/backend/src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Local Imports
import connectDB from './web/config/dbconnect';
import authRoutes from './web/routes/auth.routes';
import userRoutes from './web/routes/user.routes';
import pollRoutes from './web/routes/poll.routes';
import roomRoutes from './web/routes/room.routes';
import reportRoutes from './web/routes/report.routes'; // New
import transcriptRoutes from './web/routes/transcript.routes'; // New ASR transcripts
import meetingsRoutes from './web/routes/meetings.routes'; // AI Questions & Meetings
import segmentsRoutes from './routes/segments'; // New segments for transcript segmentation
import statsRoutes from './web/routes/stats.routes';
import { errorHandler } from './web/middlewares/error.middleware';
// import pollRoutes from './web/routes/poll.routes';
import path from 'path'; // <-- Import path module
import settingsRouter from './web/routes/settings';
import saveQuestionsRouter from './web/routes/save_questions';
import pollConfigRoutes from './web/routes/poll.routes';
import sessionReportRoutes from './web/routes/sessionReport.routes'; // <-- NEW IMPORT

dotenv.config();
connectDB();

const app = express();

// Enhanced CORS configuration for both local and production
const allowedOrigins = [
  'http://localhost:5174',              // Local development frontend
  'http://localhost:3000',              // Alternative local port
  process.env.FRONTEND_URL,             // Production frontend URL
  ...(process.env.CORS_ORIGINS?.split(',') || [])  // Additional origins from env
].filter(Boolean); // Remove undefined/null values

app.use(cors({
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
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/settings', settingsRouter);
app.use('/questions', saveQuestionsRouter);
app.use('/api/poll', pollConfigRoutes);

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});


// before your routes:
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// app.use(cors({
//   origin: 'http://localhost:5174', // frontend URL
//   credentials: true
// }));
// --- NEW STATIC FILE SERVING MIDDLEWARE ---
// This makes the 'uploads' folder publicly accessible at '/uploads'
//app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes); // <-- NEW
app.use('/api/rooms', roomRoutes); // <-- NEW
app.use('/api/reports', reportRoutes); // New
app.use('/api/transcripts', transcriptRoutes); // ASR transcripts
app.use('/api/meetings', meetingsRoutes); // AI Questions & Meetings
app.use('/api/segments', segmentsRoutes); // Transcript segments
app.use('/api/session-reports', sessionReportRoutes); // <-- NEW ROUTE
app.use('/api/stats', statsRoutes); // <-- host/dashboard stats

app.use(errorHandler);

export default app;