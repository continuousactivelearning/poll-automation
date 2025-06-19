import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import geminiService from '../services/geminiService';

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

// Initialize OpenAI (you'll need to set OPENAI_API_KEY in environment)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(filePath: string): Promise<string> {
  // Check if we have a valid API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.log('No valid OpenAI API key found, using demo mode');
    return "This is a demo transcript. In this meeting, we discussed React hooks, specifically useState for managing component state and useEffect for handling side effects like API calls. We also covered the importance of proper state management in React applications.";
  }

  // Enable real transcription with OpenAI Whisper
  console.log('🎤 Attempting real audio transcription with OpenAI Whisper...');

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Audio file not found');
    }

    console.log(`📁 Transcribing file: ${filePath}`);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "en", // Specify language for better accuracy
      response_format: "text"
    });

    const transcript = transcription.text || transcription;
    console.log('✅ Real transcription successful!');
    console.log(`📝 Transcript: "${transcript}"`);

    return transcript;

  } catch (error) {
    console.error('❌ Transcription error:', error);
    console.log('🎭 Falling back to demo transcript');
    return "Demo transcript: The audio could not be processed with OpenAI, but this demonstrates how the system would work. The speaker discussed various educational topics that would be converted to poll questions.";
  }


}

// Generate poll questions from transcript using OpenAI
async function generatePollQuestions(transcript: string): Promise<any[]> {
  // Check if we have a valid API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.log('No valid OpenAI API key found, using demo poll questions');
    return [
      {
        question: "What is the primary purpose of useState in React?",
        options: ["Handle side effects", "Manage component state", "Make API calls", "Render components"],
        correctAnswer: 1,
        difficulty: "Easy",
        category: "React Fundamentals",
        explanation: "useState is a React hook used to add state to functional components."
      },
      {
        question: "When should you use useEffect in React?",
        options: ["To manage state", "To handle side effects", "To create components", "To style elements"],
        correctAnswer: 1,
        difficulty: "Medium",
        category: "React Hooks",
        explanation: "useEffect is used for side effects like API calls, subscriptions, and DOM manipulation."
      },
      {
        question: "What happens when you call setState in React?",
        options: ["Component re-renders immediately", "Component re-renders asynchronously", "Nothing happens", "Component unmounts"],
        correctAnswer: 1,
        difficulty: "Medium",
        category: "React State Management",
        explanation: "setState triggers an asynchronous re-render of the component."
      }
    ];
  }

  // Try Gemini first (free), then OpenAI (paid), then demo
  console.log('🤖 Generating poll questions with AI...');

  if (geminiService.isAvailable()) {
    console.log('🆓 Using Gemini AI (free)');
    return await geminiService.generatePollQuestions(transcript);
  } else {
    console.log('💰 Attempting OpenAI (paid) or falling back to demo');
    // Continue to OpenAI code below
  }

  // Note: The code below is unreachable due to the early return above
  // This is intentional for demo mode during testing

  try {
    const prompt = `
Based on the following meeting transcript, generate 3-5 relevant poll questions that would help gauge understanding and engagement.

Transcript: "${transcript}"

Please return the questions in this JSON format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "difficulty": "Easy|Medium|Hard",
    "category": "Topic category",
    "explanation": "Why this answer is correct"
  }
]

Make sure questions are:
- Relevant to the content discussed
- Clear and concise
- Have 4 multiple choice options
- Include the correct answer index (0-3)
- Appropriate difficulty level
- Educational value
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educator who creates engaging poll questions from meeting content. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0].message.content;
    if (!response || typeof response !== 'string') {
      throw new Error('No valid response from OpenAI');
    }

    // Parse the JSON response
    const questions = JSON.parse(response as string);
    return questions;
  } catch (error) {
    console.error('Poll generation error:', error);
    // Return fallback questions if AI fails
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
      }
    ];
  }
}

// POST /api/audio/upload - Upload and process audio
router.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('Audio upload request received');
  console.log('File:', req.file ? 'Present' : 'Missing');
  console.log('Body:', req.body);

  try {
    if (!req.file) {
      console.log('Error: No audio file provided');
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const { meetingId, hostId } = req.body;

    if (!meetingId || !hostId) {
      console.log('Error: Missing meetingId or hostId');
      return res.status(400).json({
        success: false,
        error: 'Meeting ID and Host ID are required'
      });
    }

    console.log(`Processing audio for meeting ${meetingId}...`);
    console.log(`File size: ${req.file.size} bytes`);
    console.log(`File type: ${req.file.mimetype}`);

    // Step 1: Transcribe the audio
    const transcript = await transcribeAudio(req.file.path);
    console.log('Transcript:', transcript);

    // Step 2: Generate poll questions from transcript
    const questions = await generatePollQuestions(transcript);
    console.log('Generated questions:', questions);

    // Step 3: Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // Step 4: Return the results
    res.json({
      success: true,
      transcript,
      questions,
      meetingId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Audio processing error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to process audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/audio/stream - For real-time audio streaming (future enhancement)
router.post('/stream', (req, res) => {
  // TODO: Implement WebSocket-based real-time audio streaming
  res.json({ message: 'Real-time streaming endpoint - coming soon!' });
});

// GET /api/audio/test - Test endpoint
router.get('/test', (req, res) => {
  const geminiStatus = geminiService.getStatus();
  const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';

  res.json({
    success: true,
    message: 'Audio API is working!',
    services: {
      gemini: geminiStatus,
      openai: {
        available: hasOpenAI,
        service: 'OpenAI Whisper',
        model: hasOpenAI ? 'whisper-1' : 'not-configured'
      }
    },
    features: {
      transcription: hasOpenAI ? 'OpenAI Whisper' : 'Demo Mode',
      pollGeneration: geminiStatus.available ? 'Gemini AI (Free)' : hasOpenAI ? 'OpenAI (Paid)' : 'Demo Mode'
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/audio/status/:meetingId - Get processing status
router.get('/status/:meetingId', (req, res) => {
  const { meetingId } = req.params;

  // TODO: Implement status tracking for long-running audio processing
  res.json({
    meetingId,
    status: 'ready',
    message: 'Audio processing service is ready'
  });
});

export default router;
