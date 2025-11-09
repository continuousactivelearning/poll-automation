import { Router } from 'express';
import { asyncHandler } from '../web/utils/asyncHandler';
import ServiceManager from '../services/serviceManager';

const router = Router();

/**
 * Generate questions from timer-based transcript collection
 * POST /api/questions/generate-from-timer
 */
router.post('/generate-from-timer', asyncHandler(async (req, res) => {
  const { transcriptText, sessionId, meetingId, timerDuration } = req.body;

  // Validate required fields
  if (!transcriptText || !sessionId || !meetingId) {
    return res.status(400).json({
      error: 'Missing required fields: transcriptText, sessionId, meetingId'
    });
  }

  console.log(`🕒 [TIMER-API] Generating questions for timer session: ${sessionId}`);
  console.log(`🕒 [TIMER-API] Meeting: ${meetingId}, Duration: ${timerDuration}ms`);
  console.log(`🕒 [TIMER-API] Transcript length: ${transcriptText.length} characters`);

  try {
    // Get the properly initialized service manager
    const serviceManager = ServiceManager.getInstance();
    const autoQuestionService = serviceManager.getAutoQuestionService();
    
    if (!autoQuestionService) {
      return res.status(500).json({
        error: 'Question service not initialized'
      });
    }

    // Use the existing auto question service but with timer-specific handling
    await autoQuestionService.generateQuestionsForTranscripts(
      transcriptText, 
      meetingId,
      5 // Max 5 questions for timer sessions to maintain quality
    );

    console.log(`✅ [TIMER-API] Questions generated successfully for session: ${sessionId}`);

    res.json({
      success: true,
      message: 'Timer-based questions generated successfully',
      sessionId,
      meetingId,
      questionsId: `timer_${sessionId}_${Date.now()}`,
      transcriptLength: transcriptText.length,
      timerDuration
    });

  } catch (error) {
    console.error(`❌ [TIMER-API] Error generating questions for session ${sessionId}:`, error);
    
    res.status(500).json({
      error: 'Failed to generate timer-based questions',
      sessionId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Get all timer-based questions for a meeting
 * GET /api/questions/timer/:meetingId
 */
router.get('/timer/:meetingId', asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  console.log(`📋 [TIMER-API] Fetching timer questions for meeting: ${meetingId}`);

  try {
    // Get the properly initialized service manager
    const serviceManager = ServiceManager.getInstance();
    const autoQuestionService = serviceManager.getAutoQuestionService();
    
    if (!autoQuestionService) {
      return res.status(500).json({
        error: 'Question service not initialized'
      });
    }

    // Get all questions for the meeting and filter timer-based ones
    const allQuestions = await autoQuestionService.getQuestionsByMeeting(meetingId);
    
    // Filter for timer-based questions (those without segmentId)
    const timerQuestions = allQuestions.filter((q: any) => !q.segmentId);
    
    console.log(`📋 [TIMER-API] Found ${timerQuestions.length} timer-based question sets`);

    res.json({
      success: true,
      meetingId,
      timerQuestions,
      count: timerQuestions.length
    });

  } catch (error) {
    console.error(`❌ [TIMER-API] Error fetching timer questions for meeting ${meetingId}:`, error);
    
    res.status(500).json({
      error: 'Failed to fetch timer-based questions',
      meetingId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Health check for questions API
 * GET /api/questions/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'questions-api',
    timestamp: new Date().toISOString(),
    features: {
      timerQuestions: true,
      segmentQuestions: true,
      geminiIntegration: true
    }
  });
});

export default router;