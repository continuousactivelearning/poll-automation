// apps/backend/src/web/routes/achievements.routes.ts

import { Router, NextFunction } from 'express';
import { getUserAchievements, getDebugAchievementData } from '../controllers/achievements.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Get user's achievements and progress
router.get('/me', authenticate, (req, res, next: NextFunction) => {
  // call async controller and forward errors to express error handler
  // do not return the controller promise directly so the handler signature matches RequestHandler
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getUserAchievements(req, res).catch(next);
});

// Debug endpoint to check achievement data
router.get('/debug', authenticate, (req, res, next: NextFunction) => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getDebugAchievementData(req, res).catch(next);
});

export default router;