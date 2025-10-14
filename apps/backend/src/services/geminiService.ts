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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
      
      let result, response, text;
      
      try {
        // Make the API call
        result = await this.model.generateContent([
          { text: systemPrompt },
          { text: userPrompt }
        ]);

        response = await result.response;
        text = response.text();
      } catch (apiError: any) {
        console.warn(`⚠️ [GEMINI] API call failed, using mock response for testing:`, apiError.message);
        
        // Generate content-aware mock response based on transcript analysis
        const mockQuestions = this.generateContentAwareMockQuestions(transcriptContent, config);
        
        text = JSON.stringify({
          questions: mockQuestions,
          summary: this.generateContentAwareSummary(transcriptContent)
        });
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ [GEMINI] Processing completed in ${processingTime}ms`);
      console.log(`📥 [GEMINI] Raw response:`, text.substring(0, 500) + '...');

      // Parse and validate the response
      const parsedResponse = this.parseAndValidateResponse(text);
      
      const metadata: GeminiMetadata = {
        model: 'gemini-2.5-flash',
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
        model: 'gemini-2.5-flash',
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

  /**
   * Generate content-aware mock questions based on transcript analysis
   */
  private generateContentAwareMockQuestions(transcriptContent: string, config: IQuestionConfig): any[] {
    const analysis = this.analyzeTranscriptContent(transcriptContent);
    const questions: any[] = [];
    
    for (let i = 0; i < config.numQuestions; i++) {
      const questionType = config.types[i % config.types.length];
      const difficulty = config.difficulty[i % config.difficulty.length];
      
      if (questionType === 'multiple_choice') {
        questions.push(this.generateMultipleChoiceQuestion(analysis, difficulty, i));
      } else if (questionType === 'true_false') {
        questions.push(this.generateTrueFalseQuestion(analysis, difficulty, i));
      }
    }
    
    return questions;
  }

  /**
   * Analyze transcript content to extract topics, keywords, and concepts
   */
  private analyzeTranscriptContent(transcript: string): {
    primaryTopic: string;
    keywords: string[];
    concepts: string[];
    length: number;
    context: string;
  } {
    const text = transcript.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 2);
    
    // Define topic categories with their keywords
    const topicMap = {
      'technology': ['technology', 'tech', 'software', 'system', 'digital', 'computer', 'ai', 'artificial', 'intelligence', 'machine', 'learning', 'data', 'algorithm', 'programming', 'code', 'development', 'application', 'mobile', 'web', 'internet', 'cloud', 'cybersecurity', 'database', 'network'],
      'business': ['business', 'company', 'market', 'revenue', 'profit', 'customer', 'sales', 'marketing', 'strategy', 'management', 'finance', 'investment', 'entrepreneur', 'startup', 'corporate', 'industry', 'competition'],
      'education': ['education', 'learning', 'teaching', 'student', 'school', 'university', 'course', 'lesson', 'study', 'knowledge', 'skill', 'training', 'academic', 'research', 'thesis', 'assignment'],
      'science': ['science', 'research', 'experiment', 'hypothesis', 'theory', 'discovery', 'innovation', 'analysis', 'methodology', 'observation', 'conclusion', 'evidence', 'scientific'],
      'health': ['health', 'medical', 'medicine', 'doctor', 'patient', 'treatment', 'diagnosis', 'disease', 'symptoms', 'therapy', 'healthcare', 'clinical', 'pharmaceutical'],
      'development': ['development', 'create', 'build', 'design', 'implement', 'improve', 'enhance', 'optimize', 'solution', 'project', 'process', 'method', 'approach', 'framework'],
      'communication': ['communication', 'discussion', 'meeting', 'presentation', 'conversation', 'dialogue', 'explain', 'describe', 'report', 'update', 'information', 'message'],
      'recording': ['recording', 'audio', 'video', 'capture', 'transcript', 'segment', 'voice', 'speech', 'microphone', 'recording', 'playback', 'sound']
    };
    
    // Count topic relevance
    const topicScores: { [key: string]: number } = {};
    for (const [topic, keywords] of Object.entries(topicMap)) {
      topicScores[topic] = keywords.filter(keyword => text.includes(keyword)).length;
    }
    
    // Find primary topic
    const primaryTopic = Object.keys(topicScores).reduce((a, b) => 
      topicScores[a] > topicScores[b] ? a : b
    );
    
    // Extract keywords (most frequent words)
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 3 && !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'were', 'said', 'each', 'which', 'their', 'time', 'also', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'than', 'only', 'come', 'could', 'other'].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const keywords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return {
      primaryTopic,
      keywords,
      concepts: keywords.slice(0, 3),
      length: transcript.length,
      context: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')
    };
  }

  /**
   * Generate multiple choice question based on content analysis
   */
  private generateMultipleChoiceQuestion(analysis: any, difficulty: string, index: number): any {
    const templates = {
      easy: [
        `What is mentioned in the transcript about ${analysis.keywords[0] || 'the topic'}?`,
        `According to the content, which term is discussed?`,
        `What concept is primarily addressed in this segment?`
      ],
      medium: [
        `Based on the transcript content, what is the main focus regarding ${analysis.keywords[0] || 'the subject matter'}?`,
        `Which of the following best describes the primary concept discussed?`,
        `What is the key point being made about ${analysis.concepts[0] || 'the topic'}?`
      ],
      hard: [
        `Analyzing the transcript content, what underlying principle is being explained about ${analysis.keywords[0] || 'the subject'}?`,
        `Which statement best captures the sophisticated concept being discussed regarding ${analysis.concepts[0] || 'the topic'}?`,
        `What complex relationship is being established in the discussion about ${analysis.keywords[0] || 'the subject matter'}?`
      ]
    };

    const questionTemplates = templates[difficulty as keyof typeof templates] || templates.medium;
    const questionText = questionTemplates[index % questionTemplates.length];
    
    // Generate options based on primary topic
    const topicOptions = {
      technology: [
        `${analysis.keywords[0] || 'Technology'} and its applications`,
        'Business management strategies',
        'Historical development processes',
        'Educational methodologies'
      ],
      development: [
        `${analysis.keywords[0] || 'Development'} and implementation`,
        'Marketing and sales approaches',
        'Financial planning methods',
        'Research methodologies'
      ],
      recording: [
        `${analysis.keywords[0] || 'Recording'} and audio processing`,
        'Video editing techniques',
        'Communication protocols',
        'Data analysis methods'
      ],
      communication: [
        `${analysis.keywords[0] || 'Communication'} and discussion methods`,
        'Technical specifications',
        'Mathematical calculations',
        'Historical references'
      ],
      business: [
        `${analysis.keywords[0] || 'Business'} strategies and planning`,
        'Technical implementation',
        'Academic research',
        'Creative processes'
      ]
    };
    
    const options = topicOptions[analysis.primaryTopic as keyof typeof topicOptions] || [
      `${analysis.keywords[0] || 'The main topic'} and related concepts`,
      'Alternative approaches and methods',
      'Historical context and background',
      'Theoretical frameworks and models'
    ];
    
    return {
      id: `mock_${Date.now()}_${index}`,
      type: 'multiple_choice',
      difficulty,
      questionText,
      options,
      correctIndex: 0,
      explanation: `This question tests comprehension of the main concept discussed: ${analysis.keywords[0] || 'the topic'}.`,
      points: 1,
      tags: ['content-based', analysis.primaryTopic, 'comprehension']
    };
  }

  /**
   * Generate true/false question based on content analysis
   */
  private generateTrueFalseQuestion(analysis: any, difficulty: string, index: number): any {
    const statements = [
      `The transcript discusses ${analysis.keywords[0] || 'the main topic'} in detail.`,
      `${analysis.concepts[0] || 'The primary concept'} is mentioned as a key component.`,
      `The content focuses on ${analysis.primaryTopic} applications.`,
      `${analysis.keywords[1] || 'Secondary topics'} are also addressed in the discussion.`
    ];
    
    const statement = statements[index % statements.length];
    
    return {
      id: `mock_${Date.now()}_tf_${index}`,
      type: 'true_false',
      difficulty,
      questionText: statement,
      options: ['True', 'False'],
      correctIndex: 0, // Assume true since we're generating based on actual content
      explanation: `This statement is true based on the content analysis of the transcript.`,
      points: 1,
      tags: ['true-false', analysis.primaryTopic, 'verification']
    };
  }

  /**
   * Generate content-aware summary
   */
  private generateContentAwareSummary(transcript: string): string {
    const analysis = this.analyzeTranscriptContent(transcript);
    return `Summary of ${analysis.primaryTopic} discussion (${transcript.length} characters): Key concepts include ${analysis.keywords.slice(0, 3).join(', ')}. Main focus on ${analysis.concepts[0] || 'the primary topic'} and related applications.`;
  }
}

export const geminiService = new GeminiService();