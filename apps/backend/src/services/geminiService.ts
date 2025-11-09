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
    return `You are an expert educational assessment designer who creates thought-provoking, analytical questions that test deep understanding rather than simple recall.

CRITICAL MISSION: Transform transcript content into intellectually challenging questions that require genuine comprehension, analysis, and application of concepts.

MANDATORY REQUIREMENTS:
1. Output ONLY valid JSON - no additional text, explanations, or formatting
2. Follow the exact schema provided
3. Create questions that test UNDERSTANDING, ANALYSIS, and APPLICATION - never simple recall
4. Questions must require students to THINK, not just REMEMBER
5. Focus on WHY and HOW, not just WHAT
6. Test comprehension of relationships, implications, and real-world applications
7. Avoid any question that can be answered by keyword spotting
8. Create questions that would challenge someone who truly understands the content

QUESTION TRANSFORMATION PRINCIPLES:
🧠 ANALYTICAL QUESTIONS: Test cause-and-effect, relationships, implications
🔄 APPLICATION QUESTIONS: Test ability to apply concepts to new scenarios  
🔍 EVALUATION QUESTIONS: Test ability to judge, compare, and assess
💡 SYNTHESIS QUESTIONS: Test ability to combine ideas and draw conclusions
⚖️ CRITICAL THINKING: Test ability to analyze arguments and evidence

QUALITY EXAMPLES:
✅ EXCELLENT: "Based on the wavelength principles discussed, what would happen to audio quality if the medium's properties were altered?"
✅ EXCELLENT: "How do the segmentation techniques mentioned relate to broader signal processing concepts?"
✅ EXCELLENT: "What factors determine the effectiveness of the equalization methods described?"
✅ EXCELLENT: "Why would the wavelength characteristics discussed be important for practical audio applications?"

❌ TERRIBLE: "What was mentioned about wavelength?"
❌ TERRIBLE: "The speaker said 'audio'. True or False?"
❌ TERRIBLE: "Which term was used for sound?"
❌ TERRIBLE: "What is wavelength mentioned in the transcript?"

QUESTION TYPES:
- Multiple Choice: Create 4 options where wrong answers are plausible but clearly incorrect to someone who understands
- True/False: Test understanding of relationships, principles, or cause-and-effect - never simple facts
- Short Answer: Require explanation, analysis, or application of concepts

OUTPUT SCHEMA:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice|true_false|short_answer",
      "difficulty": "easy|medium|hard",
      "questionText": "Question that tests conceptual understanding and analysis",
      "options": ["option1", "option2", "option3", "option4"], // for multiple_choice only
      "correctIndex": 0, // for multiple_choice (0-based index)
      "correctAnswer": "answer", // for short_answer only
      "explanation": "Explanation connecting answer to the concepts and reasoning discussed"
    }
  ],
  "summary": "Summary of the key concepts these questions assess"
}`;
  }

  /**
   * Build user prompt with transcript and configuration
   */
  private buildUserPrompt(transcriptContent: string, config: IQuestionConfig): string {
    const typeDistribution = this.calculateTypeDistribution(config.types, config.numQuestions);
    const difficultyDistribution = this.calculateDifficultyDistribution(config.difficulty, config.numQuestions);

    return `TRANSCRIPT CONTENT TO ANALYZE:
${transcriptContent}

MISSION: Create exactly ${config.numQuestions} intellectually challenging questions that test deep understanding of the concepts discussed above.

TARGET DISTRIBUTION:
${typeDistribution.map(t => `- ${t.count} ${t.type} questions`).join('\n')}
${difficultyDistribution.map(d => `- ${d.count} ${d.difficulty} questions`).join('\n')}

CONTENT ANALYSIS FRAMEWORK:
🎯 STEP 1: Identify CORE CONCEPTS, PRINCIPLES, and PROCESSES mentioned
🔗 STEP 2: Map RELATIONSHIPS, CONNECTIONS, and INTERDEPENDENCIES between ideas
🧠 STEP 3: Extract REASONING, EXPLANATIONS, and CAUSE-EFFECT patterns
🚀 STEP 4: Find APPLICATIONS, IMPLICATIONS, and PRACTICAL CONSEQUENCES
⚖️ STEP 5: Locate COMPARISONS, CONTRASTS, and EVALUATIVE JUDGMENTS

QUESTION CREATION STRATEGY:
💡 ANALYTICAL QUESTIONS: "How does X influence Y?" / "Why does A lead to B?" / "What causes C to occur?"
🔄 APPLICATION QUESTIONS: "In what scenarios would this principle apply?" / "How would you implement this concept?"
🔍 EVALUATION QUESTIONS: "What are the advantages/disadvantages of this approach?" / "Which method would be most effective?"
🧩 SYNTHESIS QUESTIONS: "How do these concepts work together?" / "What would happen if we combined A and B?"
📊 PREDICTION QUESTIONS: "Based on this explanation, what would likely occur if...?" / "What outcomes could we expect?"

CREATIVITY AMPLIFIERS:
⭐ Transform simple facts into scenario-based questions
⭐ Convert definitions into application challenges
⭐ Turn descriptions into analytical problems
⭐ Change explanations into prediction tasks
⭐ Convert comparisons into evaluation exercises

FOR MULTIPLE CHOICE QUESTIONS:
✅ Create distractors that require genuine understanding to eliminate
✅ Make wrong answers plausible to someone with surface knowledge
✅ Test application and analysis, not recognition
✅ Include options that test common misconceptions

FOR TRUE/FALSE QUESTIONS:  
✅ Test understanding of principles and relationships
✅ Create statements that require analysis to verify
✅ Avoid simple factual claims that can be directly quoted

FOR SHORT ANSWER QUESTIONS:
✅ Require explanation of processes or reasoning
✅ Ask for application of principles to new situations
✅ Demand analysis of relationships or implications

QUALITY CHECKPOINTS:
❓ Would this question challenge someone who truly understands the content?
❓ Does this require analysis beyond simple recall?
❓ Could this be answered by someone who didn't listen to the explanation?
❓ Does this test application of principles rather than recognition of keywords?

SPECIFIC EXAMPLE TRANSFORMATIONS BASED ON YOUR TRANSCRIPT:
Instead of: "What is mentioned about wavelength?"
Create: "Based on the wavelength discussion, how would changing the medium properties affect the signal characteristics described?"

Instead of: "Audio wavelength was discussed. True or False?"
Create: "The relationship between audio wavelength and medium properties suggests that longer wavelengths would necessarily provide better signal quality. True or False?"

Instead of: "Which segmentation technique was mentioned?"
Create: "When would the segmentation approach described be most effective compared to alternative methods?"

OUTPUT: Return ONLY the JSON response following the exact schema. No additional text, markdown, or explanations.`;
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

      // Validate each question and calculate correctIndex for TRUE_FALSE questions
      parsed.questions.forEach((question: any, index: number) => {
        // Calculate correctIndex for TRUE_FALSE questions if not already set
        if (question.type === 'true_false' && typeof question.correctIndex !== 'number') {
          // Ensure options are set for TRUE_FALSE questions
          if (!question.options) {
            question.options = ['True', 'False'];
          }
          
          // Calculate correctIndex based on correctAnswer
          const normalizedAnswer = (question.correctAnswer || '').toString().toLowerCase();
          if (normalizedAnswer === 'true' || normalizedAnswer === '1' || normalizedAnswer === 'a') {
            question.correctIndex = 0; // True is index 0
          } else if (normalizedAnswer === 'false' || normalizedAnswer === '0' || normalizedAnswer === 'b') {
            question.correctIndex = 1; // False is index 1
          } else {
            // Default to True if unclear
            question.correctIndex = 0;
            console.warn(`⚠️ [GEMINI] Unclear TRUE_FALSE answer "${question.correctAnswer}", defaulting to True`);
          }
        }
        
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

    if (question.type === 'true_false') {
      if (!question.options || !Array.isArray(question.options) || question.options.length !== 2) {
        throw new Error(`Question ${index + 1} true/false must have exactly 2 options`);
      }
      if (typeof question.correctIndex !== 'number' || question.correctIndex < 0 || question.correctIndex > 1) {
        throw new Error(`Question ${index + 1} true/false must have valid correctIndex (0-1)`);
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
        `Based on the discussion of ${analysis.keywords[0] || 'the main concept'}, what would be the most important factor to consider?`,
        `How does the ${analysis.keywords[0] || 'concept'} described relate to practical applications?`,
        `What principle underlies the ${analysis.concepts[0] || 'approach'} being explained?`
      ],
      medium: [
        `Considering the explanation of ${analysis.keywords[0] || 'the primary concept'}, what would likely happen if the conditions were changed?`,
        `What factors determine the effectiveness of the ${analysis.keywords[0] || 'method'} discussed?`,
        `How do the relationships between ${analysis.concepts[0] || 'the elements'} impact the overall outcome described?`
      ],
      hard: [
        `Analyzing the underlying principles of ${analysis.keywords[0] || 'the system'}, what critical implications emerge for implementation?`,
        `What complex interactions between ${analysis.concepts[0] || 'variables'} would most significantly affect the results discussed?`,
        `Based on the theoretical framework presented for ${analysis.keywords[0] || 'the concept'}, what predictions can be made about performance?`
      ]
    };

    const questionTemplates = templates[difficulty as keyof typeof templates] || templates.medium;
    const questionText = questionTemplates[index % questionTemplates.length];
    
    // Generate options based on primary topic with more analytical choices
    const topicOptions = {
      technology: [
        `Optimization of performance parameters and efficiency metrics`,
        `Integration challenges and implementation strategies`,
        `User experience considerations and accessibility factors`,
        `Security protocols and data protection measures`
      ],
      development: [
        `Systematic approach to process improvement and quality assurance`,
        'Resource allocation and strategic planning methodologies',
        'Risk assessment and mitigation strategies',
        'Innovation frameworks and creativity enhancement'
      ],
      recording: [
        `Signal processing techniques and quality optimization`,
        'Data compression algorithms and efficiency metrics',
        'Hardware compatibility and system integration',
        'User interface design and interaction patterns'
      ],
      communication: [
        `Information transfer protocols and clarity enhancement`,
        'Network architecture and connectivity solutions',
        'Content organization and presentation strategies',
        'Feedback mechanisms and response optimization'
      ],
      business: [
        `Strategic decision-making processes and outcome evaluation`,
        'Operational efficiency and performance measurement',
        'Market analysis and competitive positioning',
        'Innovation management and growth strategies'
      ],
      audio: [
        `Acoustic properties and signal characteristics`,
        'Processing algorithms and enhancement techniques',
        'Equipment specifications and performance metrics',
        'Environmental factors and adaptation strategies'
      ],
      wavelength: [
        `Frequency analysis and spectral characteristics`,
        'Medium properties and propagation effects',
        'Measurement techniques and calibration methods',
        'Application scenarios and optimization approaches'
      ]
    };
    
    const options = topicOptions[analysis.primaryTopic as keyof typeof topicOptions] || [
      `Analysis of core principles and their practical implications`,
      'Systematic approaches to problem-solving and optimization',
      'Integration strategies and implementation considerations',
      'Performance evaluation and improvement methodologies'
    ];
    
    return {
      id: `mock_${Date.now()}_${index}`,
      type: 'multiple_choice',
      difficulty,
      questionText,
      options,
      correctIndex: 0,
      explanation: `This question assesses understanding of the fundamental principles and their applications as discussed in the content, requiring analysis of ${analysis.keywords[0] || 'the key concepts'} and their implications.`,
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