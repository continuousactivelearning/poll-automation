import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IQuestion, IQuestionConfig } from '../web/models/questions.model';

export interface GeminiResponse {
  questions: IQuestion[];
  summary: string;
}

export interface GeminiMetadata {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  processingTime: number;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Generate questions from transcript content using Gemini API
   */
  async generateQuestions(
    transcriptContent: string,
    config: IQuestionConfig,
    meetingId: string
  ): Promise<{ response: GeminiResponse; metadata: GeminiMetadata }> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 [GEMINI] Generating ${config.numQuestions} questions for meeting: ${meetingId}`);
      console.log(`📝 [GEMINI] Transcript length: ${transcriptContent.length} characters`);
      console.log(`⚙️ [GEMINI] Config:`, config);

      // Build the system and user prompts
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(transcriptContent, config);

      console.log(`📤 [GEMINI] Sending request to Gemini API...`);
      
      // Make the API call
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ [GEMINI] Processing completed in ${processingTime}ms`);
      console.log(`📥 [GEMINI] Raw response:`, text.substring(0, 500) + '...');

      // Parse and validate the response
      const parsedResponse = this.parseAndValidateResponse(text);
      
      const metadata: GeminiMetadata = {
        model: 'gemini-pro',
        processingTime,
        // Note: Gemini API doesn't provide token usage in the current version
        // These would need to be estimated or calculated if needed
      };

      console.log(`✅ [GEMINI] Successfully generated ${parsedResponse.questions.length} questions`);
      
      return {
        response: parsedResponse,
        metadata
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [GEMINI] Error generating questions after ${processingTime}ms:`, error);
      throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Summarize transcript content if it exceeds context limits
   */
  async summarizeTranscript(
    transcriptContent: string,
    targetLength: number = 3000
  ): Promise<{ summary: string; metadata: GeminiMetadata }> {
    const startTime = Date.now();
    
    try {
      console.log(`📝 [GEMINI] Summarizing transcript (${transcriptContent.length} -> ~${targetLength} chars)`);

      const systemPrompt = `You are a transcript summarization expert. Your task is to create a comprehensive summary that preserves all key information, concepts, and details from the original transcript while reducing length.

REQUIREMENTS:
1. Maintain all important topics, concepts, and technical details
2. Preserve speaker context and key discussions
3. Keep educational/instructional content intact
4. Target length: ~${targetLength} characters
5. Output only the summary text, no additional formatting`;

      const userPrompt = `Please summarize this meeting transcript while preserving all key educational content and concepts:

TRANSCRIPT:
${transcriptContent}

SUMMARY:`;

      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      const response = await result.response;
      const summary = response.text().trim();
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ [GEMINI] Transcript summarized in ${processingTime}ms (${summary.length} chars)`);

      const metadata: GeminiMetadata = {
        model: 'gemini-pro',
        processingTime
      };

      return { summary, metadata };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [GEMINI] Error summarizing transcript after ${processingTime}ms:`, error);
      throw new Error(`Failed to summarize transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt for question generation
   */
  private buildSystemPrompt(): string {
    return `You are an expert exam question generator. Your task is to create educational questions based on meeting transcripts.

REQUIREMENTS:
1. Output ONLY valid JSON - no additional text, explanations, or formatting
2. Follow the exact schema provided
3. Create questions that test understanding of the key concepts discussed
4. Ensure questions are educational and fair
5. For multiple choice: include exactly 4 options with only one correct answer
6. For true/false: create clear, unambiguous statements
7. Provide helpful explanations for each answer
8. Distribute difficulty levels as requested
9. Make questions specific to the transcript content

OUTPUT SCHEMA:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice|true_false|short_answer",
      "difficulty": "easy|medium|hard",
      "questionText": "Clear, specific question text",
      "options": ["option1", "option2", "option3", "option4"], // for multiple_choice only
      "correctIndex": 0, // for multiple_choice (0-based index)
      "correctAnswer": "answer", // for short_answer only
      "explanation": "Clear explanation of the correct answer"
    }
  ],
  "summary": "Brief one-sentence summary of the question set"
}`;
  }

  /**
   * Build user prompt with transcript and configuration
   */
  private buildUserPrompt(transcriptContent: string, config: IQuestionConfig): string {
    const typeDistribution = this.calculateTypeDistribution(config.types, config.numQuestions);
    const difficultyDistribution = this.calculateDifficultyDistribution(config.difficulty, config.numQuestions);

    return `TRANSCRIPT:
${transcriptContent}

INSTRUCTIONS:
Generate exactly ${config.numQuestions} questions based on the above transcript.

QUESTION TYPE DISTRIBUTION:
${typeDistribution.map(t => `- ${t.count} ${t.type} questions`).join('\n')}

DIFFICULTY DISTRIBUTION:
${difficultyDistribution.map(d => `- ${d.count} ${d.difficulty} questions`).join('\n')}

GUIDELINES:
- Questions must be directly related to content discussed in the transcript
- Test understanding of key concepts, not just memorization
- Multiple choice questions need exactly 4 options
- True/false questions should be clear and unambiguous
- Include explanations that reference the transcript content
- Ensure questions are educational and appropriate

Return the JSON response following the exact schema provided in the system prompt.`;
  }

  /**
   * Parse and validate Gemini API response
   */
  private parseAndValidateResponse(responseText: string): GeminiResponse {
    try {
      // Clean up the response text (remove any markdown or extra formatting)
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedResponse);

      // Validate the response structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Response missing questions array');
      }

      if (!parsed.summary || typeof parsed.summary !== 'string') {
        throw new Error('Response missing summary string');
      }

      // Validate each question
      parsed.questions.forEach((question: any, index: number) => {
        this.validateQuestion(question, index);
      });

      return parsed as GeminiResponse;

    } catch (error) {
      console.error('❌ [GEMINI] Failed to parse response:', responseText);
      throw new Error(`Invalid response format: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  /**
   * Validate individual question structure
   */
  private validateQuestion(question: any, index: number): void {
    const requiredFields = ['id', 'type', 'difficulty', 'questionText', 'explanation'];
    
    for (const field of requiredFields) {
      if (!question[field]) {
        throw new Error(`Question ${index + 1} missing required field: ${field}`);
      }
    }

    if (!['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(question.type)) {
      throw new Error(`Question ${index + 1} has invalid type: ${question.type}`);
    }

    if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
      throw new Error(`Question ${index + 1} has invalid difficulty: ${question.difficulty}`);
    }

    // Validate type-specific fields
    if (question.type === 'multiple_choice') {
      if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error(`Question ${index + 1} multiple choice must have exactly 4 options`);
      }
      if (typeof question.correctIndex !== 'number' || question.correctIndex < 0 || question.correctIndex > 3) {
        throw new Error(`Question ${index + 1} must have valid correctIndex (0-3)`);
      }
    }

    if (question.type === 'short_answer' && !question.correctAnswer) {
      throw new Error(`Question ${index + 1} short answer must have correctAnswer`);
    }
  }

  /**
   * Calculate question type distribution
   */
  private calculateTypeDistribution(types: string[], totalQuestions: number): Array<{type: string, count: number}> {
    const distribution = types.map((type, index) => ({
      type,
      count: Math.floor(totalQuestions / types.length)
    }));

    // Distribute remaining questions
    const remaining = totalQuestions - distribution.reduce((sum, item) => sum + item.count, 0);
    for (let i = 0; i < remaining; i++) {
      distribution[i % distribution.length].count++;
    }

    return distribution;
  }

  /**
   * Calculate difficulty distribution
   */
  private calculateDifficultyDistribution(difficulties: string[], totalQuestions: number): Array<{difficulty: string, count: number}> {
    const distribution = difficulties.map((difficulty, index) => ({
      difficulty,
      count: Math.floor(totalQuestions / difficulties.length)
    }));

    // Distribute remaining questions
    const remaining = totalQuestions - distribution.reduce((sum, item) => sum + item.count, 0);
    for (let i = 0; i < remaining; i++) {
      distribution[i % distribution.length].count++;
    }

    return distribution;
  }
}

export const geminiService = new GeminiService();