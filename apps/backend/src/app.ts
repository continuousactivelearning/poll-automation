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
import inviteRouter from './web/routes/invite';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/settings', settingsRouter);
app.use('/questions', saveQuestionsRouter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/invite', inviteRouter);

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.');
});

app.use(errorHandler);

export default app;
