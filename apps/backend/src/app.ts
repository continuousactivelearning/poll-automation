import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './web/routes/auth.routes';
import userRoutes from './web/routes/user.routes';
import pollRoutes from './web/routes/poll.routes';
import questionRoutes from './web/routes/question.routes';
import resultRoutes from './web/routes/result.routes';
import saveQuestionsRouter from './web/routes/save_questions';
import settingsRouter from './web/routes/settings';
import { errorHandler } from './web/middlewares/error.middleware';
import path from 'path';
import pollConfigRoutes from './web/routes/pollConfigRoutes';
import pollRoomCodeRoutes from './web/routes/pollRoomCodeRoutes';
import inviteRouter from './web/routes/invite'; // <-- Add this import
import transcriptsRouter from './web/routes/transcripts'; // AI team's transcripts route

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Added multiple origins
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/settings', settingsRouter);
app.use('/questions', saveQuestionsRouter);
app.use('/api/poll', pollConfigRoutes);
app.use('/api/room-code', pollRoomCodeRoutes);
app.use('/api/polls', pollRoutes);
app.use('/transcripts', transcriptsRouter); // AI team's transcripts route
app.use('/manual_poll_questions', saveQuestionsRouter); // AI team's manual poll questions

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

// Health check endpoint to verify both WebSocket systems
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      http: 'active',
      socketIO: 'active (poll management)',
      webSocket: 'active (transcription)',
      database: 'connected',
    },
    endpoints: {
      socketIO: '/socket.io/',
      webSocket: '/ws/transcription',
      api: '/api/*',
      transcripts: '/transcripts/*',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api', inviteRouter); // <-- Add this line after your other app.use() calls

app.use(errorHandler);

export default app;
