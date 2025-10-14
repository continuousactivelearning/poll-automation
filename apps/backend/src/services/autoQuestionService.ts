import { GeminiService } from './geminiService';
import { GeneratedQuestions } from '../web/models/questions.model';
import { Segment } from '../web/models/Segment';
import { IQuestionConfig } from '../web/models/questions.model';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

export class AutoQuestionService {
  private geminiService: GeminiService;
  private io?: SocketIOServer;

  constructor(io?: SocketIOServer) {
    this.geminiService = new GeminiService();
    this.io = io;
  }

  /**
   * Set the Socket.IO server instance for real-time events
   */
  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Get the Socket.IO server instance
   */
  getSocketIOInstance(): SocketIOServer | undefined {
    return this.io;
  }

  /**
   * Automatically generate questions for a segment
   * This is called after a segment is successfully saved
   * @param segmentId - The segment ID to generate questions for
   * @param meetingId - The meeting ID  
   * @param maxQuestions - Optional limit on number of questions (overrides automatic calculation for quality control)
   */
  async generateQuestionsForSegment(segmentId: string, meetingId: string, maxQuestions?: number): Promise<void> {
    try {
      console.log(`🚀 [AUTO-QUESTIONS] Request sent to Gemini API for Segment ${segmentId}`);

      // Fetch the segment from database
      console.log(`📋 [AUTO-QUESTIONS] Fetching segment from database: ${segmentId}`);
      const segment = await Segment.findById(segmentId);
      if (!segment) {
        throw new Error(`Segment not found: ${segmentId}`);
      }
      console.log(`✅ [AUTO-QUESTIONS] Segment found: ${segment.segmentNumber} with ${segment.transcriptText.length} chars`);

      // Get recommended question count based on transcript length or user preference
      const calculatedQuestions = this.calculateRecommendedQuestions(segment.transcriptText);
      const questionCount = maxQuestions ? Math.min(maxQuestions, calculatedQuestions) : calculatedQuestions;
      
      console.log(`📊 [AUTO-QUESTIONS] Question count: ${questionCount} ${maxQuestions ? `(limited by maxQuestions: ${maxQuestions}, calculated: ${calculatedQuestions})` : `(calculated: ${calculatedQuestions})`}`);
      
      // Configure question generation - combination of Multiple Choice + True/False
      const config: IQuestionConfig = {
        numQuestions: questionCount,
        types: ['multiple_choice', 'true_false'], // Combination as requested
        difficulty: ['easy', 'medium', 'hard'], // Balanced difficulty
        contextLimit: 8000,
        includeExplanations: true,
        pointsPerQuestion: 1
      };

      console.log(`📊 [AUTO-QUESTIONS] Generating ${questionCount} questions for segment ${segment.segmentNumber}`);

      // Generate questions using Gemini API
      console.log(`🤖 [AUTO-QUESTIONS] Calling GeminiService.generateQuestions...`);
      const { response, metadata } = await this.geminiService.generateQuestions(
        segment.transcriptText,
        config,
        meetingId
      );
      console.log(`✅ [AUTO-QUESTIONS] GeminiService returned ${response.questions.length} questions`);

      // Save questions to database
      console.log(`💾 [AUTO-QUESTIONS] Creating GeneratedQuestions document...`);
      const generatedQuestions = new GeneratedQuestions({
        meetingId: new mongoose.Types.ObjectId(meetingId),
        hostId: segment.hostmail, // Using hostmail as hostId for now
        segmentId: segmentId, // Link to the specific segment
        segmentNumber: segment.segmentNumber, // Store segment number for easy reference
        generatedAt: new Date(),
        config,
        questions: response.questions,
        summary: response.summary,
        status: 'published', // Auto-publish generated questions
        publishedAt: new Date(),
        transcriptSource: {
          totalWords: segment.transcriptText.split(/\s+/).length,
          sourceLength: segment.transcriptText.length,
          summarized: false,
          originalLength: segment.transcriptText.length
        },
        geminiMetadata: metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`💾 [AUTO-QUESTIONS] Saving to database...`);
      await generatedQuestions.save();
      console.log(`✅ [AUTO-QUESTIONS] Questions saved to database with ID: ${generatedQuestions._id}`);
      console.log(`✅ [AUTO-QUESTIONS] Questions generated and saved successfully for Segment ${segment.segmentNumber}`);

      console.log(`🎯 [AUTO-QUESTIONS] Questions generated for Segment ${segment.segmentNumber}`);
      console.log(`✅ [AUTO-QUESTIONS] ${response.questions.length} questions saved to database`);

      // Emit WebSocket event to notify frontend
      console.log(`📡 [AUTO-QUESTIONS] Emitting WebSocket event...`);
      this.emitQuestionsGenerated(meetingId, {
        segmentId,
        segmentNumber: segment.segmentNumber,
        questions: response.questions,
        summary: response.summary,
        generatedAt: generatedQuestions.generatedAt
      });
      console.log(`✅ [AUTO-QUESTIONS] WebSocket event emitted successfully`);

    } catch (error) {
      console.error(`❌ [AUTO-QUESTIONS] Error generating questions for segment ${segmentId}:`, error);
      console.error(`❌ [AUTO-QUESTIONS] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  /**
   * Automatically generate questions for transcript text (direct from WebSocket)
   * This is called when transcripts are saved via WebSocket
   * @param transcriptText - The transcript text to generate questions from
   * @param meetingId - The meeting ID
   * @param maxQuestions - Optional limit on number of questions (overrides automatic calculation for quality control)
   */
  async generateQuestionsForTranscripts(transcriptText: string, meetingId: string, maxQuestions?: number): Promise<void> {
    try {
      console.log(`🚀 [AUTO-QUESTIONS] Request sent to Gemini API for transcript text (${transcriptText.length} chars)`);

      // Get recommended question count based on transcript length or user preference
      const calculatedQuestions = this.calculateRecommendedQuestions(transcriptText);
      const questionCount = maxQuestions ? Math.min(maxQuestions, calculatedQuestions) : calculatedQuestions;
      
      console.log(`📊 [AUTO-QUESTIONS] Question count: ${questionCount} ${maxQuestions ? `(limited by maxQuestions: ${maxQuestions}, calculated: ${calculatedQuestions})` : `(calculated: ${calculatedQuestions})`}`);
      
      // Configure question generation - combination of Multiple Choice + True/False
      const config: IQuestionConfig = {
        numQuestions: questionCount,
        types: ['multiple_choice', 'true_false'], // Combination as requested
        difficulty: ['easy', 'medium', 'hard'], // Balanced difficulty
        contextLimit: 8000,
        includeExplanations: true,
        pointsPerQuestion: 1
      };

      console.log(`🎯 [AUTO-QUESTIONS] Generating ${questionCount} questions for transcript`);

      // Generate questions using Gemini API
      const { response, metadata } = await this.geminiService.generateQuestions(
        transcriptText,
        config,
        meetingId
      );
      
      // Get next available segment number for this meeting
      const nextSegmentNumber = await this.getNextSegmentNumber(meetingId);
      
      // Prepare additional metadata
      const enhancedMetadata = {
        ...metadata,
        autoGenerated: true
      };

      // Save to database
      const generatedQuestions = new GeneratedQuestions({
        meetingId: new mongoose.Types.ObjectId(meetingId),
        segmentNumber: nextSegmentNumber,
        questions: response.questions,
        summary: response.summary,
        generatedAt: new Date(),
        status: 'published', // Auto-publish generated questions
        publishedAt: new Date(),
        transcriptSource: {
          totalWords: transcriptText.split(/\s+/).length,
          sourceLength: transcriptText.length,
          summarized: false,
          originalLength: transcriptText.length
        },
        geminiMetadata: enhancedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await generatedQuestions.save();

      console.log(`🎯 [AUTO-QUESTIONS] Questions generated for transcript segment ${nextSegmentNumber}`);
      console.log(`✅ [AUTO-QUESTIONS] ${response.questions.length} questions saved to database`);

      // Emit WebSocket event to notify frontend
      this.emitQuestionsGenerated(meetingId, {
        segmentNumber: nextSegmentNumber,
        questions: response.questions,
        summary: response.summary,
        generatedAt: generatedQuestions.generatedAt
      });

    } catch (error) {
      console.error(`❌ [AUTO-QUESTIONS] Error generating questions for transcript:`, error);
      throw error;
    }
  }

  /**
   * Emit WebSocket event when questions are generated
   */
  private emitQuestionsGenerated(meetingId: string, data: any) {
    if (this.io) {
      console.log(`📡 [AUTO-QUESTIONS] Emitting questionsGenerated event for meeting ${meetingId}`);
      this.io.to(`meeting-${meetingId}`).emit('questionsGenerated', {
        meetingId,
        ...data
      });
    } else {
      console.warn(`⚠️ [AUTO-QUESTIONS] Socket.IO not available for emitting events`);
    }
  }

  /**
   * Calculate recommended number of questions based on transcript length
   * Updated to focus on quality over quantity - generates fewer, higher-quality questions
   */
  private calculateRecommendedQuestions(transcriptText: string): number {
    const wordCount = transcriptText.split(/\s+/).length;
    const charCount = transcriptText.length;

    // QUALITY-FOCUSED APPROACH: Generate fewer, better questions
    // This prevents overwhelming users with too many questions
    let recommendedQuestions;

    if (wordCount <= 50 || charCount <= 300) {
      // Very short segments - 1 high-quality question
      recommendedQuestions = 1;
    } else if (wordCount <= 150 || charCount <= 900) {
      // Short segments - 2 focused questions  
      recommendedQuestions = 2;
    } else if (wordCount <= 300 || charCount <= 1800) {
      // Medium segments - 3 quality questions
      recommendedQuestions = 3;
    } else if (wordCount <= 500 || charCount <= 3000) {
      // Long segments - 4 targeted questions
      recommendedQuestions = 4;
    } else {
      // Very long segments - cap at 5 questions for quality focus
      // Better to have 5 excellent questions than 10 mediocre ones
      recommendedQuestions = 5;
    }

    // QUALITY ASSURANCE: Always prioritize quality over quantity
    // Ensure minimum of 1, maximum of 5 for optimal learning experience
    const finalCount = Math.max(1, Math.min(5, recommendedQuestions));
    
    console.log(`🎯 [AUTO-QUESTIONS] Quality-focused question count: ${finalCount} questions for ${wordCount} words (was: ${recommendedQuestions} before quality cap)`);
    
    return finalCount;
  }

  /**
   * Get all questions for a meeting grouped by segment
   */
  async getQuestionsByMeeting(meetingId: string): Promise<any[]> {
    try {
      const questions = await GeneratedQuestions.find({ meetingId })
        .sort({ segmentNumber: 1, generatedAt: 1 })
        .select('segmentNumber questions summary generatedAt status');

      return questions;
    } catch (error) {
      console.error(`❌ [AUTO-QUESTIONS] Error fetching questions for meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Get questions for a specific segment
   */
  async getQuestionsBySegment(segmentId: string): Promise<any> {
    try {
      const questions = await GeneratedQuestions.findOne({ segmentId })
        .select('segmentNumber questions summary generatedAt status');

      return questions;
    } catch (error) {
      console.error(`❌ [AUTO-QUESTIONS] Error fetching questions for segment ${segmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get the next available segment number for a meeting
   */
  async getNextSegmentNumber(meetingId: string): Promise<number> {
    try {
      // Find the highest segment number for this meeting
      const lastSegment = await GeneratedQuestions.findOne({ meetingId })
        .sort({ segmentNumber: -1 })
        .select('segmentNumber');

      return lastSegment ? (lastSegment.segmentNumber || 0) + 1 : 1;
    } catch (error) {
      console.error(`❌ [AUTO-QUESTIONS] Error getting next segment number for meeting ${meetingId}:`, error);
      return 1; // Fallback to segment 1
    }
  }
}

export default AutoQuestionService;