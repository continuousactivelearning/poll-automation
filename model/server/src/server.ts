// server/src/server.ts
import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// --- Define the API endpoint handler ---
const generatePollHandler: RequestHandler = async (req: Request, res: Response) => {
    const { transcript } = req.body;
    if (!transcript) {
        res.status(400).json({ error: 'No transcript provided' });
        return;
    }
    console.log(`Received transcript: ${transcript}`);

    // --- UPDATED PROMPT ---
    const prompt = `
    You are an expert assistant that analyzes transcripts, including those with code snippets or technical terms, to create accurate and engaging multiple-choice poll questions.

Instructions:

1. Carefully analyze the transcript provided below. It may include natural language, technical explanations, or even code.
2. If the transcript contains only  jokes, irrelevant talk, or lacks any clear educational or technical topic (such as  "what's up", "just testing", etc.), then DO NOT generate a poll question.
   - Instead, return this exact message:
Poll generation failed: The transcript does not contain a meaningful or relevant topic for creating a poll question.

3. If the transcript **does** contain an informative and focused topic (e.g., AI, environment, coding, software, education), even if written in a technical or code-based style:
   - Identify one key **factual point** in the transcript.
   - Create **one clear and concise multiple-choice poll question** based on that point.
   - Provide **exactly four distinct options** labeled A, B, C, D.
   - Make sure **one and only one option is factually correct**.
   - Clearly mark which one is correct.

Return the output in exactly this format:

Question: [Insert your poll question here]  
Options:  
A. [Option A]  
B. [Option B]  
C. [Option C]  
D. [Option D]  
Correct: [The letter of the correct option, e.g., A]

Transcript:  
"${transcript}"

    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const poll_text = response.text();

        // --- UPDATED PARSING LOGIC ---
        const lines = poll_text.trim().split('\n');
        let question = "";
        const options: string[] = [];
        let correctOptionIndex = -1; // Use index (0-3) instead of letter

        for (const line of lines) {
            if (line.toLowerCase().startsWith("question:")) {
                question = line.substring(line.indexOf(':') + 1).trim();
            } else if (line.trim().match(/^[A-Da-d]\./)) {
                options.push(line.substring(line.indexOf('.') + 1).trim());
            } else if (line.toLowerCase().startsWith("correct:")) {
                const correctLetter = line.substring(line.indexOf(':') + 1).trim().toUpperCase();
                // Convert letter 'A', 'B', 'C', 'D' to index 0, 1, 2, 3
                correctOptionIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
            }
        }
        
        // Basic validation
        if (!question || options.length !== 4 || correctOptionIndex < 0 || correctOptionIndex > 3) {
            throw new Error(`Failed to parse poll from AI response. Response was: ${poll_text}`);
        }

        console.log(`Generated Poll: Question='${question}', Options=${options}, CorrectIndex=${correctOptionIndex}`);
        
        // --- UPDATED RESPONSE OBJECT ---
        res.status(200).json({ question, options, correctOptionIndex });

    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: "Failed to generate poll. The AI may have returned an unexpected format or an error." });
    }
};

app.post('/api/generate-poll', generatePollHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});