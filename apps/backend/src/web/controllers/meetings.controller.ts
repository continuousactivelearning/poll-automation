import { Request, Response } from 'express';
import { Content } from '../models/content.model';
import { EnhancedTranscript } from '../models/enhancedTranscript.model';
import { GeneratedQuestions } from '../models/questions.model';
import { Meeting } from '../models/meeting.model';
import { geminiService } from '../../services/geminiService';
import { Types } from 'mongoose';
import Audio from '../models/audio.model'; // Import Audio model for live transcripts

// Import the type definitions for req.user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'host' | 'student';
        iat?: number;
        exp?: number;
      };
    }
  }
}

// Interface for transcript response
interface TranscriptResponse {
  _id: any; // Use any for lean() document _id
  meetingId: string;
  participantId: string;
  displayName?: string;
  role: 'host' | 'student' | 'participant' | 'guest';
  segments: {
    text: string;
    startTime: number;
    endTime: number;
    finalized: boolean;
    confidence?: number; // Make optional to match schema
  }[];
  fullText: string;
  wordCount: number;
  totalDuration: number;
  language: string;
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/meetings/:id/transcripts
 * Get transcripts for a meeting to use in AI question generation
 */
export const getMeetingTranscripts = async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;

    console.log(`📝 [MEETINGS API] Fetching LIVE transcripts for meeting: ${meetingId}`);

    // Check if meeting exists and user has access
    const meeting = await Meeting.findOne({ 
      meetingId, 
      $or: [
        { hostId: userId },
        { 'participants.participantId': userId }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied'
      });
    }

    // 🔥 GET LIVE AUDIO TRANSCRIPTS FROM AUDIOS COLLECTION
    console.log(`🔍 [LIVE DATA] Searching for live transcripts in audios collection for meeting: ${meetingId}`);
    
    const audioTranscripts = await Audio.find({ meetingId })
      .sort({ timestamp: 1 })
      .lean();

    console.log(`📊 [LIVE DATA] Found ${audioTranscripts.length} live audio transcript records`);

    if (audioTranscripts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No live transcripts found for this meeting. Please start recording audio first.'
      });
    }

    // 📝 Process live audio transcripts
    const fullText = audioTranscripts
      .map(audio => audio.text)
      .join(' ')
      .trim();

    const totalWords = fullText.split(/\s+/).filter(word => word.length > 0).length;
    const uniqueParticipants = [...new Set(audioTranscripts.map(a => a.participantId))];
    
    // Calculate duration from first to last transcript
    const firstTimestamp = audioTranscripts[0].timestamp;
    const lastTimestamp = audioTranscripts[audioTranscripts.length - 1].timestamp;
    const totalDuration = new Date(lastTimestamp).getTime() - new Date(firstTimestamp).getTime();

    // 🤖 Calculate AI Question Generation Capability
    let questionCapability = {
      minQuestions: 1,
      maxQuestions: 20,
      recommendedQuestions: 5,
      confidence: 'low'
    };

    if (totalWords < 50) {
      questionCapability = {
        minQuestions: 1,
        maxQuestions: 3,
        recommendedQuestions: 2,
        confidence: 'very-low'
      };
    } else if (totalWords < 200) {
      questionCapability = {
        minQuestions: 2,
        maxQuestions: 5,
        recommendedQuestions: 3,
        confidence: 'low'
      };
    } else if (totalWords < 500) {
      questionCapability = {
        minQuestions: 3,
        maxQuestions: 8,
        recommendedQuestions: 5,
        confidence: 'medium'
      };
    } else if (totalWords < 1000) {
      questionCapability = {
        minQuestions: 5,
        maxQuestions: 12,
        recommendedQuestions: 8,
        confidence: 'high'
      };
    } else {
      questionCapability = {
        minQuestions: 8,
        maxQuestions: 20,
        recommendedQuestions: 10,
        confidence: 'very-high'
      };
    }

    // Convert audio transcripts to transcript response format
    const transcriptSegments = audioTranscripts.map((audio, index) => ({
      text: audio.text,
      startTime: new Date(audio.timestamp).getTime(),
      endTime: new Date(audio.timestamp).getTime() + 2000,
      finalized: audio.isFinal,
      confidence: audio.confidence,
      speaker: audio.role,
      participantId: audio.participantId
    }));

    const transcriptResponse = {
      _id: new Types.ObjectId(),
      meetingId: meetingId,
      participantId: 'multiple',
      displayName: 'Live Recording',
      role: 'host' as const,
      segments: transcriptSegments,
      fullText: fullText,
      wordCount: totalWords,
      totalDuration: totalDuration,
      language: 'en-US',
      savedAt: new Date(),
      createdAt: audioTranscripts[0].createdAt || new Date(),
      updatedAt: new Date()
    };

    console.log(`✅ [LIVE DATA] Processed live transcripts: ${totalWords} words, ${Math.round(totalDuration/1000)}s duration`);
    console.log(`🤖 [AI CAPABILITY] Can generate ${questionCapability.minQuestions}-${questionCapability.maxQuestions} questions (recommended: ${questionCapability.recommendedQuestions})`);

    res.json({
      success: true,
      data: {
        meetingId,
        transcripts: [transcriptResponse],
        summary: {
          totalRecords: audioTranscripts.length,
          totalWords,
          totalDuration,
          uniqueParticipants: uniqueParticipants.length,
          averageWordsPerMinute: totalDuration > 0 ? Math.round((totalWords / (totalDuration / 60000))) : 0,
          fullTextLength: fullText.length,
          readyForAI: fullText.length > 20 // Lower threshold for live data
        },
        questionCapability, // 🔥 NEW: AI question generation capability
        fullText // Complete text for AI processing
      }
    });

  } catch (error) {
    console.error('❌ [MEETINGS API] Error fetching live transcripts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live transcripts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/meetings/:id/generate-questions
 * Generate questions from meeting transcripts using Gemini API
 */
export const generateQuestions = async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;
    const {
      numQuestions = 5,
      types = ['multiple_choice'],
      difficulty = ['medium'],
      contextLimit = 5000,
      includeExplanations = true,
      pointsPerQuestion = 1
    } = req.body;

    console.log(`🤖 [GENERATE QUESTIONS] Starting generation for meeting: ${meetingId}`);
    console.log(`⚙️ [GENERATE QUESTIONS] Config:`, { numQuestions, types, difficulty, contextLimit });

    // Validate request
    if (!numQuestions || numQuestions < 1 || numQuestions > 20) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be between 1 and 20'
      });
    }

    if (!types || !Array.isArray(types) || types.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one question type must be specified'
      });
    }

    // Check if meeting exists and user has access
    const meeting = await Meeting.findOne({ 
      meetingId, 
      $or: [
        { hostId: userId },
        { 'participants.participantId': userId }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied'
      });
    }

    // Get transcript content
    const transcriptResponse = await getMeetingTranscriptsInternal(meetingId);
    if (!transcriptResponse.success || !transcriptResponse.data) {
      return res.status(404).json({
        success: false,
        message: 'No transcripts found for this meeting'
      });
    }

    let transcriptContent = transcriptResponse.data.fullText;
    const originalLength = transcriptContent.length;
    let summarized = false;

    // Check if content needs summarization
    if (transcriptContent.length > contextLimit) {
      console.log(`📝 [GENERATE QUESTIONS] Content too long (${transcriptContent.length}), summarizing...`);
      
      const summaryResult = await geminiService.summarizeTranscript(transcriptContent, contextLimit);
      transcriptContent = summaryResult.summary;
      summarized = true;
      
      console.log(`✅ [GENERATE QUESTIONS] Summarized: ${originalLength} -> ${transcriptContent.length} chars`);
    }

    // Generate questions using Gemini API
    const config = {
      numQuestions,
      types,
      difficulty,
      contextLimit,
      includeExplanations,
      pointsPerQuestion
    };

    const result = await geminiService.generateQuestions(transcriptContent, config, meetingId);

    // Save generated questions to database
    const generatedQuestions = new GeneratedQuestions({
      meetingId,
      hostId: userId,
      config,
      questions: result.response.questions,
      summary: result.response.summary,
      status: 'draft',
      transcriptSource: {
        totalWords: transcriptResponse.data.summary.totalWords,
        sourceLength: transcriptContent.length,
        summarized,
        originalLength: summarized ? originalLength : undefined
      },
      geminiMetadata: result.metadata
    });

    await generatedQuestions.save();

    // Update meeting metadata
    await Meeting.updateOne(
      { meetingId },
      {
        $inc: { 'metadata.totalQuestions': result.response.questions.length },
        $set: { 'metadata.lastQuestionGeneratedAt': new Date() }
      }
    );

    console.log(`✅ [GENERATE QUESTIONS] Successfully generated ${result.response.questions.length} questions`);

    res.json({
      success: true,
      data: {
        id: generatedQuestions._id,
        meetingId,
        questions: result.response.questions,
        summary: result.response.summary,
        config,
        metadata: {
          generatedAt: generatedQuestions.generatedAt,
          transcriptSource: generatedQuestions.transcriptSource,
          geminiMetadata: result.metadata,
          status: 'draft'
        }
      }
    });

  } catch (error) {
    console.error('❌ [GENERATE QUESTIONS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/meetings/:id/questions
 * Get generated questions for a meeting
 */
export const getMeetingQuestions = async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;
    const { status } = req.query;

    console.log(`📋 [GET QUESTIONS] Fetching questions for meeting: ${meetingId}`);

    // Check access
    const meeting = await Meeting.findOne({ 
      meetingId, 
      $or: [
        { hostId: userId },
        { 'participants.participantId': userId }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or access denied'
      });
    }

    // Build query
    const query: any = { meetingId };
    if (status) {
      query.status = status;
    }

    const questionSets = await GeneratedQuestions.find(query)
      .sort({ generatedAt: -1 })
      .lean();

    console.log(`✅ [GET QUESTIONS] Found ${questionSets.length} question sets`);

    res.json({
      success: true,
      data: questionSets
    });

  } catch (error) {
    console.error('❌ [GET QUESTIONS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/meetings/:id/questions/:questionId
 * Update a specific question before publishing
 */
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id: meetingId, questionId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    console.log(`✏️ [UPDATE QUESTION] Updating question ${questionId} in meeting: ${meetingId}`);

    // Find the question set and validate access
    const questionSet = await GeneratedQuestions.findOne({
      meetingId,
      hostId: userId,
      'questions.id': questionId
    });

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or access denied'
      });
    }

    if (questionSet.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update published questions'
      });
    }

    // Update the specific question
    const questionIndex = questionSet.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Apply updates
    Object.assign(questionSet.questions[questionIndex], updates);
    questionSet.updatedAt = new Date();

    await questionSet.save();

    console.log(`✅ [UPDATE QUESTION] Question updated successfully`);

    res.json({
      success: true,
      data: questionSet.questions[questionIndex]
    });

  } catch (error) {
    console.error('❌ [UPDATE QUESTION] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/meetings/:id/publish-questions
 * Publish questions to students
 */
export const publishQuestions = async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;
    const { questionSetId, questionIds } = req.body;

    console.log(`📢 [PUBLISH QUESTIONS] Publishing questions for meeting: ${meetingId}`);

    // Find and validate the question set
    const questionSet = await GeneratedQuestions.findOne({
      _id: questionSetId,
      meetingId,
      hostId: userId,
      status: 'draft'
    });

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found or already published'
      });
    }

    // Filter questions if specific IDs provided
    let questionsToPublish = questionSet.questions;
    if (questionIds && Array.isArray(questionIds)) {
      questionsToPublish = questionSet.questions.filter(q => questionIds.includes(q.id));
    }

    if (questionsToPublish.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions to publish'
      });
    }

    // Update question set status
    questionSet.status = 'published';
    questionSet.publishedAt = new Date();
    questionSet.questions = questionsToPublish;

    await questionSet.save();

    // TODO: Send WebSocket event to students
    // This would integrate with your existing WebSocket system
    console.log(`🔔 [PUBLISH QUESTIONS] Should send WebSocket event to students`);

    console.log(`✅ [PUBLISH QUESTIONS] Published ${questionsToPublish.length} questions`);

    res.json({
      success: true,
      data: {
        id: questionSet._id,
        meetingId,
        publishedQuestions: questionsToPublish.length,
        publishedAt: questionSet.publishedAt,
        status: 'published'
      }
    });

  } catch (error) {
    console.error('❌ [PUBLISH QUESTIONS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish questions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * DELETE /api/meetings/:id/questions
 * Delete generated questions for a meeting
 */
export const deleteMeetingQuestions = async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;
    const { questionSetId } = req.body;

    console.log(`🗑️ [DELETE QUESTIONS] Deleting questions for meeting: ${meetingId}`);

    const query: any = { meetingId, hostId: userId };
    if (questionSetId) {
      query._id = questionSetId;
    }

    const result = await GeneratedQuestions.deleteMany(query);

    console.log(`✅ [DELETE QUESTIONS] Deleted ${result.deletedCount} question sets`);

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ [DELETE QUESTIONS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete questions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/meetings/:id/questions/:questionId/launch
 * Launch individual question to student poll page
 */
export const launchQuestion = async (req: Request, res: Response) => {
  try {
    const { id: meetingId, questionId } = req.params;
    const userId = req.user?.id;

    console.log(`🚀 [LAUNCH QUESTION] Launching question ${questionId} for meeting: ${meetingId}`);

    // Check if meeting exists and user has access (must be host to launch)
    const meeting = await Meeting.findOne({ 
      meetingId, 
      hostId: userId  // Only host can launch questions
    });

    if (!meeting) {
      return res.status(403).json({
        success: false,
        message: 'Only meeting host can launch questions'
      });
    }

    // Find the question in generated questions
    const generatedQuestions = await GeneratedQuestions.findOne({ 
      meetingId,
      'questions.id': questionId 
    });

    if (!generatedQuestions) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Find the specific question
    const question = generatedQuestions.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in collection'
      });
    }

    // Update question status to launched
    await GeneratedQuestions.updateOne(
      { meetingId, 'questions.id': questionId },
      { 
        $set: { 
          'questions.$.status': 'launched',
          'questions.$.launchedAt': new Date()
        }
      }
    );

    // TODO: Broadcast to students via WebSocket
    // This would integrate with your existing WebSocket system
    console.log(`📡 [LAUNCH QUESTION] Broadcasting question to students in meeting: ${meetingId}`);
    
    // For now, we'll simulate the broadcast
    const launchData = {
      type: 'question_launched',
      meetingId,
      question: {
        id: question.id,
        question: question.questionText,
        options: question.options || [],
        timeLimit: 30, // Default 30 seconds
        points: question.points || 1
      },
      launchedAt: new Date(),
      launchedBy: userId
    };

    console.log(`✅ [LAUNCH QUESTION] Question launched successfully:`, {
      questionId,
      questionText: question.questionText.substring(0, 50) + '...',
      optionsCount: question.options?.length || 0
    });

    res.json({
      success: true,
      message: 'Question launched successfully',
      data: {
        questionId,
        meetingId,
        launchedAt: new Date(),
        question: launchData.question
      }
    });

  } catch (error) {
    console.error('❌ [LAUNCH QUESTION] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to launch question',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Internal helper function to get transcripts
 */
async function getMeetingTranscriptsInternal(meetingId: string) {
  try {
    // Try enhanced transcripts first
    let transcripts: TranscriptResponse[] = [];
    
    const enhancedTranscripts = await EnhancedTranscript.find({ meetingId })
      .sort({ savedAt: 1 })
      .lean();

    if (enhancedTranscripts && enhancedTranscripts.length > 0) {
      transcripts = enhancedTranscripts as TranscriptResponse[];
    }

    // Fall back to content collection if needed
    if (transcripts.length === 0) {
      const contentRecords = await Content.find({ meetingId })
        .sort({ sessionStartTime: 1 })
        .lean();

      if (contentRecords && contentRecords.length > 0) {
        transcripts = contentRecords.map(content => ({
          _id: new Types.ObjectId(),
          meetingId: content.meetingId,
          participantId: content.hostId,
          displayName: content.hostName,
          role: 'host' as const,
          segments: content.transcript.map(t => ({
            text: t.text,
            startTime: t.timestamp.getTime(),
            endTime: t.timestamp.getTime() + 2000,
            finalized: true,
            confidence: t.confidence
          })),
          fullText: content.transcript.map(t => t.text).join(' '),
          wordCount: content.wordCount,
          totalDuration: content.totalDuration || 0,
          language: 'en-US',
          savedAt: content.sessionEndTime || content.createdAt,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt
        }));
      }
    }

    if (transcripts.length === 0) {
      return {
        success: false,
        message: 'No transcripts found'
      };
    }

    const totalWords = transcripts.reduce((sum, t) => sum + (t.wordCount || 0), 0);
    const totalDuration = transcripts.reduce((sum, t) => sum + (t.totalDuration || 0), 0);
    const fullText = transcripts.map(t => t.fullText).join('\n\n');

    return {
      success: true,
      data: {
        meetingId,
        transcripts,
        summary: {
          totalRecords: transcripts.length,
          totalWords,
          totalDuration,
          averageWordsPerMinute: totalDuration > 0 ? Math.round((totalWords / (totalDuration / 60000))) : 0,
          fullTextLength: fullText.length,
          readyForAI: fullText.length > 100
        },
        fullText
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch transcripts',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}