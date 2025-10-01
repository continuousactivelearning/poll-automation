import { Router, RequestHandler } from 'express';
import {
  getMeetingTranscripts,
  generateQuestions,
  publishQuestions,
  getMeetingQuestions,
  updateQuestion,
  deleteMeetingQuestions,
  launchQuestion
} from '../controllers/meetings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/meetings/:id/transcripts - Get transcripts for AI question generation
router.get('/:id/transcripts', getMeetingTranscripts as RequestHandler);

// POST /api/meetings/:id/generate-questions - Generate questions using Gemini API
router.post('/:id/generate-questions', generateQuestions as RequestHandler);

// GET /api/meetings/:id/questions - Get generated questions for a meeting
router.get('/:id/questions', getMeetingQuestions as RequestHandler);

// PUT /api/meetings/:id/questions/:questionId - Update a specific question
router.put('/:id/questions/:questionId', updateQuestion as RequestHandler);

// POST /api/meetings/:id/questions/:questionId/launch - Launch individual question to students
router.post('/:id/questions/:questionId/launch', launchQuestion as RequestHandler);

// POST /api/meetings/:id/publish-questions - Publish questions to students
router.post('/:id/publish-questions', publishQuestions as RequestHandler);

// DELETE /api/meetings/:id/questions - Delete generated questions
router.delete('/:id/questions', deleteMeetingQuestions as RequestHandler);

export default router;