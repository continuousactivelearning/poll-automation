import { AutoQuestionService } from './autoQuestionService';
import { GeminiService } from './geminiService';
import TimerQuestionsService from './timerQuestionsService';
import { Server as SocketIOServer } from 'socket.io';
import { IQuestionConfig } from '../web/models/questions.model';

/**
 * Global service manager for auto question generation
 * This allows routes to access the service with Socket.IO instance
 */
class ServiceManager {
  private static instance: ServiceManager;
  private autoQuestionService?: AutoQuestionService;
  private geminiService?: GeminiService;
  private timerQuestionsService?: TimerQuestionsService;

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  initializeServices(io: SocketIOServer) {
    this.autoQuestionService = new AutoQuestionService(io);
    this.geminiService = new GeminiService();
    this.timerQuestionsService = new TimerQuestionsService();
    console.log('✅ [SERVICES] Auto question service initialized with Socket.IO');
    console.log('✅ [SERVICES] Gemini service initialized for timer transcripts');
    console.log('✅ [SERVICES] Timer questions service initialized for creative questions');
  }

  getAutoQuestionService(): AutoQuestionService {
    if (!this.autoQuestionService) {
      throw new Error('AutoQuestionService not initialized. Call initializeServices first.');
    }
    return this.autoQuestionService;
  }

  getTimerQuestionsService(): TimerQuestionsService {
    if (!this.timerQuestionsService) {
      throw new Error('TimerQuestionsService not initialized. Call initializeServices first.');
    }
    return this.timerQuestionsService;
  }

  /**
   * Generate creative, attention-grabbing questions for timer-based transcripts
   * Uses new TimerQuestionsService for unique question generation
   */
  async generateCreativeTimerQuestions(combinedTranscript: string): Promise<any[]> {
    if (!this.timerQuestionsService) {
      throw new Error('TimerQuestionsService not initialized. Call initializeServices first.');
    }

    try {
      console.log('🎯 [TIMER-QUESTIONS] Generating creative timer-based questions...');
      console.log(`📝 [TIMER-QUESTIONS] Transcript length: ${combinedTranscript.length} characters`);

      const timerQuestions = await this.timerQuestionsService.generateTimerBasedQuestions(
        combinedTranscript,
        {
          creativityLevel: 'maximum',
          focusOnSummary: true,
          includeDiscussionFlow: true
        }
      );

      console.log(`✅ [TIMER-QUESTIONS] Generated ${timerQuestions.length} creative questions`);
      return timerQuestions;

    } catch (error) {
      console.error('❌ [TIMER-QUESTIONS] Error generating creative timer questions:', error);
      throw new Error(`Failed to generate creative timer questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * LEGACY: Generate questions specifically for timer-based transcripts
   * Uses enhanced prompts for longer, combined transcript content
   * @deprecated Use generateCreativeTimerQuestions instead
   */
  async generateTimerQuestions(combinedTranscript: string): Promise<any[]> {
    console.warn('⚠️ [TIMER-QUESTIONS] Using legacy generateTimerQuestions method. Consider using generateCreativeTimerQuestions instead.');
    
    if (!this.geminiService) {
      throw new Error('GeminiService not initialized. Call initializeServices first.');
    }

    try {
      console.log('⏱️ [TIMER-QUESTIONS] Generating questions for timer transcript...');
      console.log(`📝 [TIMER-QUESTIONS] Transcript length: ${combinedTranscript.length} characters`);

      // Enhanced config for timer-based questions
      const timerConfig: IQuestionConfig = {
        numQuestions: Math.min(8, Math.max(3, Math.floor(combinedTranscript.length / 200))),
        types: ['multiple_choice', 'true_false', 'short_answer'],
        difficulty: ['easy', 'medium', 'hard'],
        contextLimit: 8000,
        includeExplanations: true,
        pointsPerQuestion: 1
      };

      const result = await this.geminiService.generateQuestions(
        combinedTranscript,
        timerConfig,
        'timer-session-' + Date.now()
      );

      console.log(`✅ [TIMER-QUESTIONS] Generated ${result.response.questions.length} questions`);
      
      // Add timer-specific metadata to questions
      const timerQuestions = result.response.questions.map((question, index) => ({
        ...question,
        id: `timer-${Date.now()}-${index}`,
        source: 'timer-transcript',
        generatedAt: new Date().toISOString(),
        transcriptLength: combinedTranscript.length
      }));

      return timerQuestions;

    } catch (error) {
      console.error('❌ [TIMER-QUESTIONS] Error generating timer questions:', error);
      throw new Error(`Failed to generate timer questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ServiceManager;