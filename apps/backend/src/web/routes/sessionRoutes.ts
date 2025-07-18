// apps/backend/src/web/routes/sessionRoutes.ts
import { Router } from 'express';
import {
  createSession,
  extendSession,
  deactivateSession,
  getMySessions,
  getSessionById,
  getSessionByRoomCode,
  joinSession,
  removeParticipant,
} from '../controllers/sessionController';
import { protect } from '../middleware/authMiddleware'; // Import your authentication middleware

const router = Router();

// All session routes will be prefixed with /api/sessions in index.ts

// Host-specific routes (protected)
router.post('/create', protect, createSession);
router.get('/my-sessions', protect, getMySessions);
router.put('/:id/extend', protect, extendSession);
router.put('/:id/deactivate', protect, deactivateSession);
router.put('/:sessionId/remove-participant/:participantId', protect, removeParticipant);

// General session access routes
// Route to get a single session by its ID (Host or allowed participant)
router.get('/:id', protect, getSessionById); // Protected because it returns full session details

// Route for students to join a session (Protected, requires student authentication)
router.post('/join', protect, joinSession);

// FIXED: Add 'protect' middleware to the /by-code/:roomCode route
// This ensures req.user is populated for access validation within the controller.
router.get('/by-code/:roomCode', protect, getSessionByRoomCode);

export default router;
