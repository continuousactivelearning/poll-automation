// geminiService.ts - Google Gemini AI integration for free AI processing
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Using demo mode.');
      this.genAI = null as any;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('✅ Gemini AI service initialized');
    }
  }

  /**
   * Generate poll questions from transcript using Gemini AI
   */
  async generatePollQuestions(transcript: string): Promise<any[]> {
    if (!this.model) {
      console.log('🎭 Gemini API not configured, using demo questions');
      return this.getDemoQuestions();
    }

    try {
      const prompt = `
Based on the following educational transcript, generate 3-5 multiple choice questions that test comprehension and key concepts. 

Transcript: "${transcript}"

Please respond with a JSON array of questions in this exact format:
[
  {
    "question": "What is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "Easy",
    "category": "General",
    "explanation": "Brief explanation of why this is correct"
  }
]

Make sure the questions are:
- Relevant to the transcript content
- Educational and meaningful
- Have 4 options each
- Include the correct answer index (0-3)
- Appropriate difficulty level
- Clear explanations

Respond ONLY with the JSON array, no additional text.
`;

      console.log('🤖 Generating questions with Gemini AI...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('📝 Gemini AI response received');

      // Parse the JSON response
      const questions = JSON.parse(text.trim());
      
      if (!Array.isArray(questions)) {
        throw new Error('Invalid response format from Gemini');
      }

      console.log(`✅ Generated ${questions.length} questions with Gemini AI`);
      return questions;

    } catch (error) {
      console.error('❌ Gemini AI error:', error);
      console.log('🎭 Falling back to demo questions');
      return this.getDemoQuestions();
    }
  }

  /**
   * Generate real-time transcript analysis using Gemini AI
   */
  async analyzeTranscriptChunk(transcript: string, chunkIndex: number): Promise<string> {
    if (!this.model) {
      return this.getDemoTranscript(chunkIndex);
    }

    try {
      const prompt = `
Analyze this educational content and provide a brief, engaging summary or key insight:

Content: "${transcript}"

Respond with a single sentence that captures the main educational point or insight. Keep it concise and educational.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text().trim();

      console.log(`🧠 Gemini analysis: "${analysis}"`);
      return analysis;

    } catch (error) {
      console.error('❌ Gemini analysis error:', error);
      return this.getDemoTranscript(chunkIndex);
    }
  }

  /**
   * Generate contextual poll question based on recent transcript
   */
  async generateContextualPoll(transcript: string, chunkIndex: number): Promise<any> {
    if (!this.model) {
      return this.getDemoPoll(chunkIndex);
    }

    try {
      const prompt = `
Based on this educational content, create ONE multiple choice question that tests understanding:

Content: "${transcript}"

Respond with a JSON object in this exact format:
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "difficulty": "Easy",
  "category": "Topic Category",
  "explanation": "Why this answer is correct"
}

Make the question relevant, educational, and appropriately challenging.
Respond ONLY with the JSON object, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const poll = JSON.parse(text);
      console.log(`🎯 Generated contextual poll: "${poll.question}"`);
      return poll;

    } catch (error) {
      console.error('❌ Gemini poll generation error:', error);
      return this.getDemoPoll(chunkIndex);
    }
  }

  /**
   * Demo questions fallback
   */
  private getDemoQuestions(): any[] {
    return [
      {
        question: "Based on the discussion, what was the main topic covered?",
        options: ["Technology", "Business Strategy", "Team Management", "Product Development"],
        correctAnswer: 0,
        difficulty: "Medium",
        category: "General",
        explanation: "This question helps assess if participants understood the main focus of the meeting."
      },
      {
        question: "What was the key learning objective mentioned?",
        options: ["Understanding concepts", "Memorizing facts", "Following procedures", "Completing tasks"],
        correctAnswer: 0,
        difficulty: "Easy",
        category: "Learning Objectives",
        explanation: "The primary goal was to help participants understand the core concepts discussed."
      },
      {
        question: "Which approach was recommended for implementation?",
        options: ["Quick fixes", "Systematic planning", "Random testing", "Immediate deployment"],
        correctAnswer: 1,
        difficulty: "Medium",
        category: "Implementation",
        explanation: "Systematic planning ensures better outcomes and reduces risks."
      }
    ];
  }

  /**
   * Demo transcript fallback
   */
  private getDemoTranscript(chunkIndex: number): string {
    const demoTranscripts = [
      "Welcome to today's educational session.",
      "We'll be covering important concepts and practical applications.",
      "Let's start with the fundamental principles.",
      "These concepts are essential for understanding the topic.",
      "We'll also discuss best practices and implementation strategies.",
      "Error handling and optimization are crucial considerations.",
      "Let's look at some practical examples and use cases.",
      "Testing and validation ensure reliability and quality.",
      "Finally, we'll review deployment and maintenance strategies."
    ];

    return demoTranscripts[chunkIndex % demoTranscripts.length];
  }

  /**
   * Demo poll fallback
   */
  private getDemoPoll(chunkIndex: number): any {
    const demoPolls = [
      {
        question: "What is the primary focus of this educational session?",
        options: ["Theory only", "Practical application", "Historical context", "Future predictions"],
        correctAnswer: 1,
        difficulty: "Easy",
        category: "General",
        explanation: "The session focuses on practical application of concepts."
      },
      {
        question: "Why are best practices important?",
        options: ["They're trendy", "They ensure quality", "They're required", "They're optional"],
        correctAnswer: 1,
        difficulty: "Medium",
        category: "Best Practices",
        explanation: "Best practices help ensure quality and consistency in implementation."
      },
      {
        question: "What should be prioritized in implementation?",
        options: ["Speed only", "Quality and reliability", "Cost reduction", "Feature quantity"],
        correctAnswer: 1,
        difficulty: "Medium",
        category: "Implementation",
        explanation: "Quality and reliability should be prioritized for long-term success."
      }
    ];

    return demoPolls[chunkIndex % demoPolls.length];
  }

  /**
   * Check if Gemini API is available
   */
  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; service: string; model: string } {
    return {
      available: this.isAvailable(),
      service: 'Google Gemini',
      model: this.isAvailable() ? 'gemini-pro' : 'demo-mode'
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
