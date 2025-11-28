// Frontend Gemini API integration for question generation
interface GeminiQuestionResponse {
  questions: Array<{
    id: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    difficulty: 'easy' | 'medium' | 'hard';
    questionText: string;
    options?: string[];
    correctAnswer: string | number;
    explanation?: string;
    points: number;
  }>;
  summary: string;
}

// Mock question generator for testing without API key
function generateMockQuestions(fullText: string, config: any): Promise<GeminiQuestionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const questionType = config.types[0] || 'multiple_choice';
      const difficulty = config.difficulty[0] || 'medium';
      const numQuestions = config.numQuestions || 3;
      
      // Extract key concepts from the transcript for better mock questions
      const words = fullText.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const topConcepts = [...new Set(words)].slice(0, 5);
      const mainConcept = topConcepts[0] || 'the content';
      
      const mockQuestions = [];
      
      const questionTemplates = {
        multiple_choice: [
          `Based on the principles discussed about ${mainConcept}, what factors would most likely influence the outcome?`,
          `How would the approach described for ${mainConcept} apply to different scenarios?`,
          `What underlying mechanisms drive the ${mainConcept} process explained in the recording?`
        ],
        true_false: [
          `The relationship between ${mainConcept} and its applications suggests that optimization always requires complex algorithms.`,
          `According to the explanation, ${mainConcept} principles remain consistent across different implementation contexts.`,
          `The methodology described for ${mainConcept} can be directly applied without considering environmental factors.`
        ],
        short_answer: [
          `Explain how the ${mainConcept} concepts discussed could be implemented in a practical setting.`,
          `Analyze the advantages and limitations of the ${mainConcept} approach described.`,
          `What factors should be considered when applying the ${mainConcept} principles to new situations?`
        ]
      };
      
      for (let i = 1; i <= numQuestions; i++) {
        const templates = questionTemplates[questionType as keyof typeof questionTemplates];
        const questionText = templates[(i - 1) % templates.length];
        
        if (questionType === 'multiple_choice') {
          mockQuestions.push({
            id: `mock-q-${i}`,
            type: 'multiple_choice' as const,
            difficulty: difficulty as any,
            questionText,
            options: [
              "A. Systematic optimization and performance enhancement strategies",
              "B. Historical precedents and traditional methodologies", 
              "C. Random implementation without structured planning",
              "D. Purely theoretical approaches without practical consideration"
            ],
            correctAnswer: "A",
            explanation: `This question tests understanding of the fundamental principles and practical applications discussed in your recording.`,
            points: 1
          });
        } else if (questionType === 'true_false') {
          mockQuestions.push({
            id: `mock-q-${i}`,
            type: 'true_false' as const,
            difficulty: difficulty as any,
            questionText,
            options: ["True", "False"],
            correctAnswer: "False",
            explanation: `This statement tests understanding of the nuanced relationships and context-dependent factors discussed in your content.`,
            points: 1
          });
        } else {
          mockQuestions.push({
            id: `mock-q-${i}`,
            type: 'short_answer' as const,
            difficulty: difficulty as any,
            questionText,
            correctAnswer: `Implementation should consider systematic analysis, context-specific factors, and optimization strategies based on the principles discussed.`,
            explanation: `This answer should demonstrate understanding of the comprehensive approach and critical thinking applied to the concepts from your recording.`,
            points: 1
          });
        }
      }
      
      resolve({
        questions: mockQuestions,
        summary: `Generated ${numQuestions} analytical mock questions from your recorded transcript (${fullText.length} characters). Configure a valid Gemini API key for AI-generated questions.`
      });
    }, 1000); // Simulate API delay
  });
}

export async function generateQuestionsWithGemini(
  fullText: string,
  config: {
    numQuestions: number;
    types: string[];
    difficulty: string[];
  }
): Promise<GeminiQuestionResponse> {
  
  // Check if we have Gemini API key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ No Gemini API key configured. Generating mock questions for testing.');
    return generateMockQuestions(fullText, config);
  }

  // Validate API key format (should start with AIza)
  if (!apiKey.startsWith('AIza')) {
    console.warn('⚠️ Invalid Gemini API key format. Generating mock questions for testing.');
    return generateMockQuestions(fullText, config);
  }

  // Convert types array to string
  const questionTypes = config.types.map(type => type.replace('_', ' ')).join(', ');
  const level = config.difficulty[0] || 'medium';
  const primaryType = config.types[0] || 'multiple_choice';

  // Construct the prompt - focused on analytical and creative questions
  const prompt = `You are an expert educational assessment designer. Based ONLY on the following recorded speech transcript, create exactly ${config.numQuestions} intellectually challenging questions at ${level} difficulty level.

CRITICAL MISSION: Generate questions that test UNDERSTANDING, ANALYSIS, and APPLICATION - never simple recall or keyword recognition.

QUALITY REQUIREMENTS:
1. Extract CORE CONCEPTS, PRINCIPLES, and PROCESSES from the actual speech content
2. Create questions that test HOW and WHY, not just WHAT was said
3. Focus on RELATIONSHIPS, IMPLICATIONS, and PRACTICAL APPLICATIONS
4. Test ability to APPLY concepts to new scenarios or ANALYZE cause-and-effect
5. Avoid questions that can be answered by finding keywords in the transcript
6. Create questions that require genuine comprehension to answer correctly
7. Question types requested: ${questionTypes}

QUESTION CREATION STRATEGIES:
🧠 ANALYTICAL: "How does X influence Y?" / "What factors determine the effectiveness of Z?"
🔄 APPLICATION: "Based on the principles discussed, what would happen if...?"
🔍 EVALUATION: "What are the advantages and limitations of the approach described?"
💡 SYNTHESIS: "How do the concepts discussed work together to achieve...?"
📊 PREDICTION: "Given the explanation provided, what outcomes could be expected when...?"

EXAMPLES OF EXCELLENT QUESTIONS:
✅ "Based on the wavelength principles discussed, how would changing the medium properties affect signal transmission?"
✅ "What factors determine the effectiveness of the segmentation approach described?"
✅ "How do the audio processing techniques mentioned relate to real-world applications?"
✅ "Why would the equalization methods discussed be important for different audio environments?"

AVOID THESE TERRIBLE PATTERNS:
❌ "What is mentioned in the transcript about [topic]?"
❌ "The speaker said [word]. True or False?"
❌ "Which term was used for [concept]?"

Generate ${config.types.includes('multiple_choice') ? 'multiple choice questions with 4 analytical options that test understanding' : ''}${config.types.includes('true_false') ? 'true/false questions that test relationships and principles' : ''}${config.types.includes('short_answer') ? 'short answer questions requiring explanation and analysis' : ''}.

Return response as valid JSON with this EXACT format:
{
  "questions": [
    {
      "id": "q1",
      "type": "${primaryType}",
      "difficulty": "${level}",
      "questionText": "Analytical question testing understanding of concepts and their applications",
      ${primaryType === 'multiple_choice' ? '"options": ["A. Conceptual option requiring analysis", "B. Plausible but incorrect analysis", "C. Alternative analytical approach", "D. Different but logical consideration"],' : ''}
      "correctAnswer": "${primaryType === 'multiple_choice' ? 'A' : 'Answer demonstrating understanding and analysis'}",
      "explanation": "Explanation connecting the answer to the reasoning and concepts discussed in the speech",
      "points": 1
    }
  ],
  "summary": "Generated ${config.numQuestions} questions covering topics actually discussed in the recorded speech"
}

RECORDED SPEECH TRANSCRIPT:
${fullText}`;

  try {
    console.log('🤖 Sending request to Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { 
                text: prompt 
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error Response:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API Response:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('📝 Generated text:', generatedText);
    
    // Try to extract JSON from the response
    let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Could not find JSON in response, trying to parse entire response');
      jsonMatch = [generatedText];
    }

    let questionData;
    try {
      questionData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Gemini response:', parseError);
      // Fallback: create a simple question from the response
      questionData = {
        questions: [{
          id: `gemini-q-${Date.now()}`,
          type: primaryType,
          difficulty: level,
          questionText: "What was the main topic discussed in the recorded speech?",
          options: ["A. Based on transcript", "B. Content mentioned", "C. Topics covered", "D. Subject discussed"],
          correctAnswer: "A",
          explanation: "Based on the actual content from the recorded speech",
          points: 1
        }],
        summary: "Generated fallback question from speech content"
      };
    }
    
    // Validate and format the response
    if (!questionData.questions || !Array.isArray(questionData.questions)) {
      throw new Error('Invalid question format in response');
    }

    // Ensure each question has required fields
    const formattedQuestions = questionData.questions.map((q: any, index: number) => ({
      id: q.id || `gemini-q-${Date.now()}-${index}`,
      type: q.type || primaryType,
      difficulty: q.difficulty || level,
      questionText: q.questionText || q.question || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer || q.answer || '',
      explanation: q.explanation || '',
      points: q.points || 1
    }));

    return {
      questions: formattedQuestions,
      summary: questionData.summary || `Generated ${formattedQuestions.length} questions from transcript content`
    };

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    throw new Error(`Failed to generate questions with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}