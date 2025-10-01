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
      
      const mockQuestions = [];
      
      for (let i = 1; i <= numQuestions; i++) {
        if (questionType === 'multiple_choice') {
          mockQuestions.push({
            id: `mock-q-${i}`,
            type: 'multiple_choice' as const,
            difficulty: difficulty as any,
            questionText: `Based on the transcript content, what was mentioned about topic ${i}?`,
            options: [
              "A. Information from the recorded transcript",
              "B. Different interpretation of the content", 
              "C. Alternative understanding of the material",
              "D. None of the above"
            ],
            correctAnswer: "A",
            explanation: `This question is based on the actual transcript content you recorded.`,
            points: 1
          });
        } else if (questionType === 'true_false') {
          mockQuestions.push({
            id: `mock-q-${i}`,
            type: 'true_false' as const,
            difficulty: difficulty as any,
            questionText: `The recorded transcript discussed relevant information about the topic.`,
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: `Based on your recorded voice transcript.`,
            points: 1
          });
        } else {
          mockQuestions.push({
            id: `mock-q-${i}`,
            type: 'short_answer' as const,
            difficulty: difficulty as any,
            questionText: `What was the main point discussed in your recorded transcript?`,
            correctAnswer: "Based on the voice recording content",
            explanation: `This answer should reflect the content from your actual voice recording.`,
            points: 1
          });
        }
      }
      
      resolve({
        questions: mockQuestions,
        summary: `Generated ${numQuestions} mock questions from your recorded transcript (${fullText.length} characters). Configure a valid Gemini API key for AI-generated questions.`
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

  // Construct the prompt - completely topic-agnostic, focused on actual speech content
  const prompt = `You are an expert educator. Based ONLY on the following recorded speech transcript, generate exactly ${config.numQuestions} educational questions at ${level} difficulty level.

CRITICAL INSTRUCTIONS:
1. Extract questions STRICTLY from the actual content spoken by the host
2. Adapt to ANY subject/topic mentioned in the transcript (science, history, literature, business, technology, arts, etc.)
3. Do NOT assume or add information not present in the transcript
4. Question types requested: ${questionTypes}
5. Focus on key concepts, facts, definitions, and ideas actually discussed
6. If transcript covers multiple topics, distribute questions across those topics
7. Use the exact terminology and context from the speech

Generate ${config.types.includes('multiple_choice') ? 'multiple choice questions with 4 realistic options (A, B, C, D)' : ''}${config.types.includes('true_false') ? 'true/false questions' : ''}${config.types.includes('short_answer') ? 'short answer questions' : ''}.

Return response as valid JSON with this EXACT format:
{
  "questions": [
    {
      "id": "q1",
      "type": "${primaryType}",
      "difficulty": "${level}",
      "questionText": "Question derived from what was actually spoken?",
      ${primaryType === 'multiple_choice' ? '"options": ["A. Option from transcript", "B. Related option", "C. Plausible alternative", "D. Another option"],' : ''}
      "correctAnswer": "${primaryType === 'multiple_choice' ? 'A' : 'Answer from transcript'}",
      "explanation": "Explanation referencing specific content from the speech",
      "points": 1
    }
  ],
  "summary": "Generated ${config.numQuestions} questions covering topics actually discussed in the recorded speech"
}

RECORDED SPEECH TRANSCRIPT:
${fullText}`;

  try {
    console.log('🤖 Sending request to Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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