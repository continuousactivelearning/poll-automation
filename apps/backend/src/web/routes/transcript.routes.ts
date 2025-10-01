import { Router, RequestHandler } from 'express';
import {
    getTranscriptsByMeeting,
    getFullTranscriptByMeeting,
    exportTranscriptAsText,
    deleteTranscriptsByMeeting,
    getTranscriptStats,
    saveTranscripts
} from '../controllers/transcript.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/transcripts - Bulk save transcripts (no auth required for frontend audio capture)
router.post('/', saveTranscripts as RequestHandler);

// All other routes require authentication
router.use(authenticate);

// GET /api/transcripts/:meetingId - Get all transcripts for a meeting
router.get('/:meetingId', getTranscriptsByMeeting as RequestHandler);

// GET /api/transcripts/:meetingId/full - Get formatted full transcript
router.get('/:meetingId/full', getFullTranscriptByMeeting as RequestHandler);

// GET /api/transcripts/:meetingId/export - Export transcript as text file
router.get('/:meetingId/export', exportTranscriptAsText as RequestHandler);

// GET /api/transcripts/:meetingId/stats - Get transcript statistics
router.get('/:meetingId/stats', getTranscriptStats as RequestHandler);

// DELETE /api/transcripts/:meetingId - Delete all transcripts for a meeting
router.delete('/:meetingId', deleteTranscriptsByMeeting as RequestHandler);

export default router;