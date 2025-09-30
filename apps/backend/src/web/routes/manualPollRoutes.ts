// apps/backend/src/web/routes/manualPollRoutes.ts
import { Router } from 'express';
// IMPORT ALL NECESSARY FUNCTIONS
import { createManualPoll, getActiveManualPoll, submitPollAnswer, getLeaderboardBySessionId } from '../controllers/manualPollController';
import { protect } from '../middleware/authMiddleware'; // Assuming you have an authMiddleware

const router = Router();

// Route to create a new manual poll (Host only)
router.post('/create', protect, createManualPoll);

// Route to get the currently active manual poll for a session (Student/Host)
router.get('/active/:roomCode', protect, getActiveManualPoll);

// NEW ROUTE: Route to submit a poll answer (Student/Host)
router.post('/submit-answer', protect, submitPollAnswer);

// NEW ROUTE: Route to get the leaderboard data for a session (Host only for now)
router.get('/leaderboard/:sessionId', protect, getLeaderboardBySessionId);

export default router;