// File: apps/backend/src/web/routes/poll.routes.ts
import { Router } from 'express';
// import {
//   getPollConfig,
//   updateHostSettings,
//   addPollQuestion,
// } from '../controllers/pollConfigController';
import { createPoll, getHostPolls } from '../controllers/poll.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/', authenticate, asyncHandler(createPoll));
router.get('/', authenticate, asyncHandler(getHostPolls));

// router.get('/config', getPollConfig);
// router.post('/settings', updateHostSettings);
// router.post('/question', addPollQuestion);

export default router;
