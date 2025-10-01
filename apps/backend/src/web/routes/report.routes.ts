// File: apps/backend/src/web/routes/report.routes.ts
import { Router } from 'express';
import { getLeaderboard } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.get('/leaderboard', authenticate, getLeaderboard); // for global
router.get('/leaderboard/:roomId', authenticate, getLeaderboard); // for meeting-specific
export default router;