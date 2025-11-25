import { GoogleGenerativeAI } from '@google/generative-ai';
import TimerQuestion from '../web/models/timerQuestions.model';

export interface TimerQuestion {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  isTimerBased: true;
  sourceTranscriptId: string;
  createdAt: Date;
}

export interface TimerQuestionGenerationConfig {
  numQuestions?: number;
  focusOnSummary?: boolean;
  includeDiscussionFlow?: boolean;
  creativityLevel?: 'standard' | 'high' | 'maximum';
}

class TimerQuestionsService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 [TIMER-QUESTIONS] Gemini API Key length:', apiKey ? apiKey.length : 'undefined');
    console.log('🔑 [TIMER-QUESTIONS] API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
  }

  /**
   * Generate creative, attention-grabbing questions from combined timer transcript
   * These questions are designed to be different from segment-based questions
   */
  async generateTimerBasedQuestions(
    combinedTranscript: string,
    config: TimerQuestionGenerationConfig = {}
  ): Promise<TimerQuestion[]> {
    try {
      console.log('🎯 [TIMER-QUESTIONS] Generating creative timer-based questions...');
      console.log(`📝 [TIMER-QUESTIONS] Transcript length: ${combinedTranscript.length} characters`);

      if (!combinedTranscript || combinedTranscript.trim().length < 100) {
        throw new Error('Combined transcript is too short for meaningful question generation');
      }

      // Limit transcript length to avoid API limits (max ~50,000 characters)
      let processedTranscript = combinedTranscript;
      if (combinedTranscript.length > 50000) {
        console.log('⚠️ [TIMER-QUESTIONS] Transcript too long, truncating to 50,000 characters');
        processedTranscript = combinedTranscript.substring(0, 50000) + '... [transcript truncated]';
      }

      const {
        numQuestions = this.calculateOptimalQuestionCount(processedTranscript),
        creativityLevel = 'maximum'
      } = config;

      const prompt = this.buildCreativeTimerPrompt(processedTranscript, numQuestions, creativityLevel);
      
      console.log('🤖 [TIMER-QUESTIONS] Sending prompt to Gemini...');
      console.log('🔑 [TIMER-QUESTIONS] API Key in use (length):', this.genAI ? 'Available' : 'Not Available');
      console.log('🎯 [TIMER-QUESTIONS] Model:', this.model);
      
      // Retry logic for handling temporary service unavailability
      let lastError: any;
      let text: string = '';
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 [TIMER-QUESTIONS] Attempt ${attempt}/3...`);
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          text = response.text();

          console.log('📤 [TIMER-QUESTIONS] Raw Gemini response:', text.substring(0, 200) + '...');
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          console.error(`❌ [TIMER-QUESTIONS] Attempt ${attempt} failed:`, error.message);
          
          // If it's a 503 error, wait and retry
          if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
            if (attempt < 3) {
              const waitTime = attempt * 2000; // 2s, 4s
              console.log(`⏳ [TIMER-QUESTIONS] Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          throw error; // If not 503 or final attempt, throw immediately
        }
      }
      
      if (lastError && !text) {
        throw lastError;
      }

      // Parse the JSON response
      const questions = this.parseGeminiResponse(text);
      
      if (!questions || questions.length === 0) {
        throw new Error('No questions generated from combined transcript');
      }

      // Add timer-specific metadata
      const timerQuestions: TimerQuestion[] = questions.map((q, index) => ({
        id: `timer-${Date.now()}-${index}`,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isTimerBased: true,
        sourceTranscriptId: '', // Will be set by caller
        createdAt: new Date()
      }));

      console.log(`✅ [TIMER-QUESTIONS] Generated ${timerQuestions.length} creative questions`);
      return timerQuestions;

    } catch (error) {
      console.error('❌ [TIMER-QUESTIONS] Error generating questions:', error);
      throw new Error(`Failed to generate timer questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a creative prompt specifically for timer-based questions
   * Focus on engagement, holistic analysis, and student attention
   */
  private buildCreativeTimerPrompt(
    combinedTranscript: string,
    numQuestions: number,
    creativityLevel: string
  ): string {
    const creativityInstructions = this.getCreativityInstructions(creativityLevel);
    
    return `
You are an AI assistant for an interactive learning platform called POLLGEN.
Analyze the following combined transcript from a classroom or discussion session.

🎯 PRIMARY GOAL: Create a set of **creative, thought-provoking, and attention-grabbing questions** that make students interested in participating in the poll.

🚀 KEY REQUIREMENTS:
- Ensure these questions are **completely different from segment-based questions**
- Cover the **entire discussion holistically** rather than individual parts
- Focus on **main themes, key insights, and overall discussion flow**
- Make questions **engaging and thought-provoking** to capture student attention
- Include questions that require **critical thinking about the whole conversation**

${creativityInstructions}

📊 QUESTION MIX (Generate ${numQuestions} questions):
- 70% Multiple-choice questions (MCQs) with creative, engaging options
- 30% True/False questions that test overall understanding

🎨 CREATIVITY GUIDELINES:
- Use engaging language that sparks curiosity
- Create scenarios or "what-if" questions when appropriate
- Include questions about implications, conclusions, or broader meanings
- Focus on synthesis rather than individual facts
- Make options memorable and distinct

📝 ANALYSIS FOCUS:
- Overall themes and main topics discussed
- Key insights or conclusions reached
- Discussion flow and progression of ideas
- Important connections between different parts
- Broader implications of the conversation

Transcript:
"""${combinedTranscript}"""

Return the questions in this exact JSON structure:
[
  {
    "type": "MCQ" | "TRUE_FALSE",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "question": "string",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "string",
    "explanation": "string"
  }
]

🎯 Remember: Make these questions different from individual segment questions - focus on the BIG PICTURE and make them ENGAGING!
`;
  }

  /**
   * Get creativity instructions based on level
   */
  private getCreativityInstructions(level: string): string {
    switch (level) {
      case 'maximum':
        return `
🌟 MAXIMUM CREATIVITY MODE:
- Use storytelling elements in questions when possible
- Create "debate-style" questions that encourage discussion
- Include hypothetical scenarios based on the content
- Use contemporary references or analogies where appropriate
- Make questions that students will want to discuss further
`;
      case 'high':
        return `
⭐ HIGH CREATIVITY MODE:
- Use engaging, conversational language
- Create questions that connect ideas across the entire discussion
- Include "Why do you think..." style questions
- Focus on implications and meanings
`;
      default:
        return `
📋 STANDARD CREATIVITY MODE:
- Use clear, engaging language
- Focus on main themes and key insights
- Create well-structured, thoughtful questions
`;
    }
  }

  /**
   * Calculate optimal number of questions based on transcript length
   */
  private calculateOptimalQuestionCount(transcript: string): number {
    const length = transcript.trim().length;
    
    if (length < 500) return 3;
    if (length < 1000) return 4;
    if (length < 2000) return 5;
    if (length < 4000) return 6;
    if (length < 6000) return 7;
    return 8; // Maximum
  }

  /**
   * Parse Gemini response and extract questions
   */
  private parseGeminiResponse(text: string): any[] {
    try {
      // Clean the response text
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      cleanText = cleanText.replace(/```\s*/, '');
      
      // Try to find JSON array in the response
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      const questions = JSON.parse(cleanText);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate question structure
      return questions.filter(q => 
        q.type && q.difficulty && q.question && q.correctAnswer && q.explanation
      );

    } catch (error) {
      console.error('❌ [TIMER-QUESTIONS] Error parsing Gemini response:', error);
      console.error('📝 [TIMER-QUESTIONS] Raw response:', text);
      
      // Return fallback questions if parsing fails
      return this.generateFallbackQuestions();
    }
  }

  /**
   * Generate fallback questions if Gemini fails
   */
  private generateFallbackQuestions(): any[] {
    return [
      {
        type: 'MCQ',
        difficulty: 'MEDIUM',
        question: 'Based on the overall discussion, what was the main theme covered?',
        options: [
          'Technical concepts and implementations',
          'General discussion and ideas',
          'Problem-solving approaches',
          'Future planning and strategies'
        ],
        correctAnswer: 'General discussion and ideas',
        explanation: 'This question was generated as a fallback when the AI response could not be parsed.'
      }
    ];
  }

  /**
   * Validate question quality and structure
   */
  private validateQuestion(question: any): boolean {
    const required = ['type', 'difficulty', 'question', 'correctAnswer', 'explanation'];
    const hasRequired = required.every(field => question[field]);
    
    if (!hasRequired) return false;
    
    // Additional validation for MCQ
    if (question.type === 'MCQ' && (!question.options || question.options.length < 2)) {
      return false;
    }
    
    // Check question length
    if (question.question.length < 10 || question.question.length > 300) {
      return false;
    }
    
    return true;
  }
}

export default TimerQuestionsService;
