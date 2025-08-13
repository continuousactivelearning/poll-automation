// apps/backend/src/web/routes/manualPollRoutes.ts
import { Router } from 'express';
import { createManualPoll, getActiveManualPoll } from '../controllers/manualPollController';
import { protect } from '../middleware/authMiddleware'; // Assuming you have an authMiddleware

const router = Router();

// Route to create a new manual poll (Host only)
router.post('/create', protect, createManualPoll);

// Route to get the currently active manual poll for a session (Student/Host)
// The roomCode will be passed as a URL parameter
router.get('/active/:roomCode', protect, getActiveManualPoll);

export default router;
