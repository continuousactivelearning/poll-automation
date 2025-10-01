# Gemini API Service Setup

## Required Dependencies

To use the Gemini API service, add the following dependency to the backend:

```bash
pnpm add @google/generative-ai
```

## Environment Variables

Add the following environment variable to your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

The `GeminiService` provides two main functions:
1. `generateQuestions()` - Generate questions from transcript content
2. `summarizeTranscript()` - Summarize long transcripts to fit context limits

## Features

- Supports multiple question types (multiple choice, true/false, short answer)
- Configurable difficulty distribution
- Automatic response validation and error handling
- Transcript summarization for large content
- Comprehensive logging and metadata tracking
- Retry logic and error recovery

## API Response Format

The service returns structured JSON with questions and metadata:

```json
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "difficulty": "medium",
      "questionText": "What is the primary purpose of React hooks?",
      "options": ["manage state", "style components", "render HTML", "access storage"],
      "correctIndex": 0,
      "explanation": "Hooks let function components manage state and side effects."
    }
  ],
  "summary": "Questions focused on React development concepts."
}
```