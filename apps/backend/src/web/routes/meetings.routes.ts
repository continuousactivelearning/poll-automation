import { Router } from 'express';
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
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/meetings/:id/transcripts - Get transcripts for AI question generation
router.get('/:id/transcripts', asyncHandler(getMeetingTranscripts));

// POST /api/meetings/:id/generate-questions - Generate questions using Gemini API
router.post('/:id/generate-questions', asyncHandler(generateQuestions));

// GET /api/meetings/:id/questions - Get generated questions for a meeting
router.get('/:id/questions', asyncHandler(getMeetingQuestions));

// PUT /api/meetings/:id/questions/:questionId - Update a specific question
router.put('/:id/questions/:questionId', asyncHandler(updateQuestion));

// POST /api/meetings/:id/questions/:questionId/launch - Launch individual question to students
router.post('/:id/questions/:questionId/launch', asyncHandler(launchQuestion));

// POST /api/meetings/:id/publish-questions - Publish questions to students
router.post('/:id/publish-questions', asyncHandler(publishQuestions));

// DELETE /api/meetings/:id/questions - Delete generated questions
router.delete('/:id/questions', asyncHandler(deleteMeetingQuestions));

export default router;