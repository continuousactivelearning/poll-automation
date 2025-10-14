import { Router, Request, Response } from 'express';
import { Segment } from '../web/models/Segment';
import ServiceManager from '../services/serviceManager';
import { asyncHandler } from '../web/utils/asyncHandler';
import mongoose from 'mongoose';

console.log('🔥🔥🔥 SEGMENTS.TS FILE IS BEING LOADED - NEW VERSION!');

const router = Router();

// POST /api/segments/save
router.post('/save', asyncHandler(async (req: Request, res: Response) => {
  console.log('🚀🚀🚀 [SEGMENTS] NEW VERSION WITH DEBUGGING - POST /save endpoint called');
  console.log('📝📝📝 [SEGMENTS] NEW VERSION - Request body received:', req.body);
  try {
    const { meetingId, hostmail, transcriptText } = req.body;

    // Validation
    if (!meetingId || !hostmail || !transcriptText) {
      return res.status(400).json({
        error: 'Missing required fields: meetingId, hostmail, and transcriptText are required'
      });
    }

    if (!transcriptText.trim()) {
      return res.status(400).json({
        error: 'transcriptText cannot be empty'
      });
    }

    // Validate meetingId format
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        error: 'Invalid meetingId format'
      });
    }

    // Get the next segment number for this meeting
    const lastSegment = await Segment.findOne({ meetingId })
      .sort({ segmentNumber: -1 })
      .select('segmentNumber');
    
    const segmentNumber = lastSegment ? lastSegment.segmentNumber + 1 : 1;

    // Create new segment
    const newSegment = new Segment({
      meetingId: new mongoose.Types.ObjectId(meetingId),
      hostmail,
      segmentNumber,
      transcriptText: transcriptText.trim(),
      timestamp: new Date()
    });

    // Save to database
    await newSegment.save();

    console.log(`✅ [SEGMENTS] Segment ${segmentNumber} saved successfully`);

    // **NEW: Automatically trigger question generation**
    // This happens asynchronously - don't wait for it to complete
    setImmediate(async () => {
      try {
        console.log(`🔄 [AUTO-QUESTIONS] Starting automatic question generation for segment ${segmentNumber}`);
        const serviceManager = ServiceManager.getInstance();
        console.log(`🔧 [AUTO-QUESTIONS] ServiceManager retrieved successfully`);
        
        const autoQuestionService = serviceManager.getAutoQuestionService();
        console.log(`🔧 [AUTO-QUESTIONS] AutoQuestionService retrieved successfully`);
        
        console.log(`📝 [AUTO-QUESTIONS] Calling generateQuestionsForSegment with:`, {
          segmentId: newSegment._id.toString(),
          meetingId,
          transcriptLength: transcriptText.trim().length
        });
        
        await autoQuestionService.generateQuestionsForSegment(
          newSegment._id.toString(),
          meetingId
        );
        
        console.log(`✅ [AUTO-QUESTIONS] Question generation completed for segment ${segmentNumber}`);
      } catch (error) {
        console.error(`❌ [AUTO-QUESTIONS] Failed to generate questions for segment ${segmentNumber}:`, error);
        console.error(`❌ [AUTO-QUESTIONS] Error details:`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          name: error instanceof Error ? error.name : 'Unknown error type'
        });
        // Don't fail the segment save if question generation fails
      }
    });

    res.status(201).json({
      message: 'Segment saved successfully',
      segmentNumber,
      segmentId: newSegment._id,
      timestamp: newSegment.timestamp
    });

  } catch (error) {
    console.error('❌ [SEGMENTS] Error saving segment:', error);
    res.status(500).json({
      error: 'Failed to save segment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GET /api/segments/last/:meetingId - Get the last saved segment for duplicate checking
router.get('/last/:meetingId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        error: 'Invalid meetingId format'
      });
    }

    // Find the most recent segment for this meeting
    const lastSegment = await Segment.findOne({ meetingId })
      .sort({ segmentNumber: -1 })
      .select('transcriptText segmentNumber timestamp');

    if (!lastSegment) {
      return res.status(404).json({
        error: 'No segments found for this meeting'
      });
    }

    console.log(`📋 [SEGMENTS] Last segment fetched for meeting ${meetingId}: segment ${lastSegment.segmentNumber}`);

    res.json({
      segmentNumber: lastSegment.segmentNumber,
      transcriptText: lastSegment.transcriptText,
      timestamp: lastSegment.timestamp
    });

  } catch (error) {
    console.error('❌ [SEGMENTS] Error fetching last segment:', error);
    res.status(500).json({
      error: 'Failed to fetch last segment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GET /api/segments/:meetingId - Get all segments for a meeting
router.get('/:meetingId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        error: 'Invalid meetingId format'
      });
    }

    const segments = await Segment.find({ meetingId })
      .sort({ segmentNumber: 1 })
      .select('segmentNumber transcriptText timestamp duration');

    res.json({
      meetingId,
      segmentCount: segments.length,
      segments
    });

  } catch (error) {
    console.error('❌ [SEGMENTS] Error fetching segments:', error);
    res.status(500).json({
      error: 'Failed to fetch segments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GET /api/segments/:meetingId/questions - Get all auto-generated questions for a meeting
router.get('/:meetingId/questions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({
        error: 'Invalid meetingId format'
      });
    }

    const autoQuestionService = ServiceManager.getInstance().getAutoQuestionService();
    const questions = await autoQuestionService.getQuestionsByMeeting(meetingId);

    res.json({
      meetingId,
      questionsCount: questions.length,
      questionsBySegment: questions
    });

  } catch (error) {
    console.error('❌ [SEGMENTS] Error fetching questions:', error);
    res.status(500).json({
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;