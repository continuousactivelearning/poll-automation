
---

*Context & Purpose*
PollGen needs a robust, secure, and real-time-capable speech-to-text subsystem that:

* Captures audio from the host’s browser in WAV format.
* Splits audio into chunks (e.g., 5-second segments).
* Sends chunks securely to a backend transcription service.
* Uses Whisper (or an equivalent open-source/local model) to transcribe each chunk.
* Returns structured JSON transcripts including metadata.
* Scales and handles errors, rate limits, and security concerns.
* Is written with industry-standard structure, clear separation of concerns, and up-to-date libraries (mid-2025).

---

### 1. 🎯 *High-Level Objectives*

1. *Reliable In-Browser Audio Capture*

   * Use modern Web APIs to record WAV audio reliably across browsers.
   * Support start/stop, pause/resume, and chunking in near real time.
   * Provide feedback (e.g., recording indicator, chunking progress).

2. *Chunking & Packaging*

   * Split continuous audio into fixed-duration WAV blobs (e.g., 5 seconds).
   * Include metadata: timestamp, sequence index, sample rate, etc.
   * Ensure minimal latency: as soon as a chunk is ready, send to backend.

3. *Secure Transmission*

   * Authenticate the host session (e.g., JWT) before sending any chunk.
   * Use HTTPS/TLS.
   * Validate size and format on both frontend and backend.
   * Implement rate-limiting or backpressure to avoid overload.

4. *Backend Transcription Service*

   * Expose a REST (or gRPC) endpoint to receive audio chunks.
   * Validate input, store or stream to transcription engine without persisting raw audio beyond needed lifetime.
   * Use Whisper (open-source) or equivalent local model: choose model size (base/medium) configurable via environment.
   * Process chunk: return JSON with:

     * seek: offset in seconds from start of session or chunk.
     * start: start time of this segment.
     * end: end time.
     * text: transcribed text.
     * tokens: optional token-level details if available.
     * confidence or avg_logprob, compression_ratio, etc.
     * language detection if needed.
   * Handle concurrent requests: queueing, pooling worker processes/GPUs.
   * Support auto-scaling or concurrency limits.

5. *Integration & Flow*

   * Frontend hook/service collects chunks, sends with session ID and auth token.
   * Backend returns transcript JSON immediately; frontend aggregates segments, displays in UI.
   * Provide retry logic on failures, exponential backoff, and user feedback on errors.

6. *Logging & Monitoring*

   * Log request metadata, durations, errors.
   * Do not log raw audio data.
   * Expose metrics (e.g., request count, average latency, error rates) for observability.

7. *Security & Validation*

   * Validate MIME type, sample rate, duration limit per chunk.
   * Protect against large payload attacks.
   * Rate-limit per user/session.
   * Sanitize any metadata or returned text before further processing.
   * Use Helmet, CORS configured to only allow frontend origin.
   * Secure secrets (e.g., model paths, API keys) via environment variables.

8. *Modular Code & Clean Structure*

   * Frontend: a standalone “useSpeechRecorder” hook or service module.
   * Backend: separate layers: route/controller, service (transcription), model loader, utilities (validation, logging), error-handling middleware.
   * Configurable parameters via env (chunk duration, Whisper model path, concurrency limits).
   * TypeScript (frontend and backend) with strict types, no any. Use DTOs/interfaces.
   * Tests: unit tests for chunking logic; integration tests mocking transcription service.

9. *Scalability & Extensibility*

   * Allow swapping Whisper for another model/service if needed.
   * Decouple recording logic from transcription logic clearly.
   * Design so that multiple hosts can record concurrently.
   * Optionally support batching or streaming to future LLM-based summarization.

10. *Documentation & Examples*

* Auto-generate README sections: how to set up local Whisper environment, dependencies (e.g., Python version, pip packages).
* Provide sample .env.example.
* Comments in code to explain flows.
* Example Postman / curl commands for testing endpoint.
* A small architecture diagram description (textual) to illustrate flow.

---

### 2. 🛠 *Tech Stack & Libraries*

* *Frontend (React + TypeScript)*

  * MediaRecorder Web API for WAV capture (or use Recorder.js approach if needed).
  * A custom React hook: useSpeechRecorder.
  * State management (e.g., Zustand slice) to store transcripts and recording status.
  * Fetch/axios for sending chunks.
  * WebSocket only if planning streaming; but initial design: REST per chunk.
  * Validation on client: check sample rate, duration before send.

* *Backend (Node.js + TypeScript)*

  * *Option A: Python microservice*

    * Use FastAPI (Python 3.9+) for transcription endpoint.
    * Dependencies: openai-whisper or whisperx or local Whisper inference with GPU (via PyTorch).
    * FFmpeg installed on server (ensure correct paths).
    * Use uvicorn/gunicorn with workers; manage GPU usage.
    * Validate incoming WAV: use pydub or wave module to inspect metadata.
  * *Option B: Node.js wrapper calling Python*

    * Node.js endpoint receives chunk, writes temp file, spawns Python process to run Whisper CLI, parses JSON output.
    * Or use a Node.js-native Whisper binding if available (but likely Python is simpler).
  * Use environment variables for Whisper model selection (WHISPER_MODEL=base or medium).
  * Concurrency control: queue tasks to avoid multiple GPU jobs at once; e.g., use a worker queue (BullMQ) or a simple in-memory queue for single-GPU.
  * Logging: pino or winston for structured logs; mask sensitive info.
  * Validation middleware: check auth JWT, parse session ID, limit payload size (\~few MB).
  * Rate limiting: express-rate-limit or similar.
  * Security middleware: helmet, cors (allow only client origin).
  * Health-check endpoint to verify model loaded.

* *Infrastructure & Deployment*

  * Containerization: Dockerfile for backend and, if separate, Python service.
  * Kubernetes or serverless: ensure GPU availability for Whisper.
  * Use secrets manager for environment variables.
  * CI/CD pipeline: linting (ESLint/Prettier TS), Python linting (flake8/black), tests.
  * Monitoring: Prometheus metrics endpoint for transcription latency, error count; Grafana dashboard.

---

### 3. 📐 *Architecture & Module Breakdown*

#### 3.1 Frontend Module: useSpeechRecorder

* *API*

  * startRecording(): void
  * stopRecording(): void
  * pauseRecording(): void (optional)
  * resumeRecording(): void (optional)
  * isRecording: boolean
  * segments: TranscriptSegment[]

    ts
    interface TranscriptSegment {
      id: string; // uuid per chunk
      seek: number; // offset in seconds
      start: number; // timestamp or offset
      end: number;
      text?: string; // after transcription arrives
      status: 'pending' | 'transcribing' | 'done' | 'error';
      errorMessage?: string;
    }
    
  * clearRecording(): void

* *Implementation Details*

  * Use MediaRecorder with proper MIME type for WAV (might need to record raw PCM and encode WAV manually).
  * Use AudioContext if necessary to reformat to WAV: record PCM, then package into WAV container via JS library.
  * On dataavailable, accumulate until chunk duration reached, then emit blob.
  * Attach timestamp metadata: record startTime via AudioContext.currentTime or Date.now().
  * Immediately send chunk via fetch or axios to backend endpoint /api/transcribe.

    * Include headers: Authorization: Bearer <token>, Content-Type: audio/wav, custom headers: X-Session-ID, X-Chunk-Index.
  * On response: parse JSON, update corresponding segment in state.
  * Handle errors: retry up to N times, then mark segment error.
  * Expose callbacks or events for UI to display progress.

* *State Management*

  * Use Zustand slice:

    * recording status, segments array, overall transcript text.
    * Actions: addSegment, updateSegment, reset.
  * React Query could be used but simpler to manage chunk requests manually.

* *UI Considerations*

  * Display live transcript as it arrives, appending segments.
  * Show pending/transcribing indicator for each chunk.
  * Allow host to pause/resume chunking.
  * Show error notifications if transcription fails for a chunk; option to retry.

#### 3.2 Backend Module: Transcription Service

* *Route & Controller*

  * Endpoint: POST /api/transcribe
  * Auth middleware: verify JWT, extract user/host ID, session ID.
  * Validation middleware:

    * Check Content-Type: audio/wav.
    * Limit payload size (e.g., max 10 MB).
    * Check required headers: X-Session-ID, X-Chunk-Index.
  * Controller logic:

    * Assign a unique request ID (UUID) for logging correlation.
    * Pass blob/buffer to transcription service.

* *Service Layer*

  * TranscriptionService.transcribeChunk(buffer: Buffer, metadata: { sessionId: string; chunkIndex: number; timestamp: number; }): Promise<TranscriptResult>
  * Internally:

    * Save buffer temporarily (e.g., to /tmp/<uuid>.wav) if Whisper CLI requires file input. Or stream directly if library supports raw buffer.
    * Invoke Whisper (Python or JS binding):

      * Example Python CLI: whisper file.wav --model base --output_format json --no_speech_threshold 0.5 ...
      * Parse JSON output: extract segments, combine if multiple sub-segments within chunk. Adjust seek, start, end relative to session or chunk start.
    * Delete temp file after processing.
    * Return structured JSON: include seek, start, end, text, avg_logprob, compression_ratio, language, etc.

* *Model Loader & Management*

  * On service start, preload Whisper model in memory (if using Python service).
  * If GPU: ensure correctly pinned. If multiple concurrent jobs: queue to avoid OOM.
  * Environment-driven model choice: WHISPER_MODEL=base|medium.
  * Health-check: /api/transcribe/health returns model loaded status.

* *Error Handling*

  * Catch any exceptions in transcription: return HTTP 500 with structured error (e.g., { error: 'TranscriptionFailed', details: '...' }).
  * For recoverable errors (e.g., temporary IO error), implement retry internally a limited number of times.
  * Log errors with correlation IDs; do not leak stack trace to client.

* *Logging & Monitoring*

  * Use structured logger (pino/winston) with levels: info, warn, error.
  * Log: request ID, session ID, chunkIndex, processing time, service latency.
  * Expose metrics: e.g., using Prometheus client for Node.js or Python: histogram for latency, counters for success/failure.

* *Security Measures*

  * Validate JWT, ensure only authenticated hosts send audio.
  * Enforce CORS: allow only frontend origin(s).
  * Rate-limiting: e.g., max X requests per minute per session/host.
  * Sanitization: though audio content is binary, metadata must be sanitized. Text result: before storing or passing to further modules, escape or sanitize problematic characters.
  * Ensure temp files are stored in secure, ephemeral directories with proper permissions and auto-cleanup.
  * Limit maximum duration per session or per total transcription quota if needed (to prevent abuse).

* *Configuration*

  * .env variables:

    
    PORT=...
    JWT_SECRET=...
    ALLOWED_ORIGINS=https://pollgen-client.example.com
    WHISPER_MODEL=base
    CHUNK_MAX_SIZE_MB=10
    MAX_CONCURRENT_TRANSCRIPTIONS=2
    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX=60
    LOG_LEVEL=info
    
  * Use a config module to load and validate env vars at startup (e.g., dotenv + zod for TS or pydantic for Python).

* *Testing*

  * *Unit tests* for:

    * Validation middleware: sending wrong MIME type, missing headers yields correct errors.
    * Service logic: mocking Whisper call to return sample JSON, ensure parsing yields correct structure.
    * Error scenarios: oversized payload, authentication failure.
  * *Integration tests*:

    * Use small WAV fixtures to simulate real audio; mock Whisper or use a minimal model for CI.
    * Test full flow: frontend-like chunk upload, backend returns expected JSON.
  * *Load/Stress tests*: simulate concurrent chunk requests, measure latency, ensure queueing works.

* *Documentation*

  * README section “Speech-to-Text Module” detailing:

    * How to install dependencies (e.g., Python environment with Whisper, Node dependencies).
    * How to start backend (or Python service).
    * Environment variable explanations.
    * How to test endpoint via curl:

      bash
      curl -X POST https://api.pollgen.example.com/api/transcribe \
        -H "Authorization: Bearer <token>" \
        -H "Content-Type: audio/wav" \
        -H "X-Session-ID: <uuid>" \
        -H "X-Chunk-Index: 1" \
        --data-binary @chunk1.wav
      
    * Expected JSON response example.
    * Troubleshooting tips: handling model loading errors, GPU memory issues.
    * Security notes: ensure HTTPS, proper CORS, rotating secrets.

---

### 4. 📋 *Detailed Prompt Structure*

Below is a suggested structure for the AI prompt text. When feeding into another AI, wrap this exactly (or adapt as needed):

`
You are to generate a complete, production-ready Speech-to-Text module for PollGen (mid-2025 standards). The module must be modular, secure, scalable, and use up-to-date libraries and best practices. Use TypeScript for Node.js backend (or Python FastAPI if specified) and React+TypeScript for frontend. Avoid any use of `any` in TypeScript, use strong typing. The flow:

1. Frontend Recorder Hook:
   - Explain how to record WAV in-browser (MediaRecorder or AudioContext-based approach).
   - Code a React hook `useSpeechRecorder` with methods: startRecording, stopRecording, pause/resume, clearRecording.
   - Implement chunking: 5-second segments, metadata (seek, start, end).
   - Show how to send chunks over HTTPS to backend: fetch/axios code with appropriate headers (Authorization, X-Session-ID, X-Chunk-Index).
   - Handle responses: update state with transcript JSON; error handling and retries.
   - Use Zustand (or equivalent) for state: store segments array, recording status, aggregated transcript text.
   - Provide example UI integration: how to show live transcript, status indicators, errors.

2. Backend Transcription Service:
   - Define environment-driven configuration: Whisper model choice, concurrency limits, allowed origins, JWT secret, rate-limit settings.
   - Code the route/controller: `POST /api/transcribe`, with TypeScript types or Python type hints.
   - Auth middleware: validate JWT, extract host/session IDs.
   - Validation middleware: check content-type, payload size, required headers.
   - Service layer: 
     - If using Python: write FastAPI endpoint, load Whisper model on startup, process each chunk file or buffer, parse JSON, return structured result. 
     - If Node.js: illustrate how to call Python subprocess or use a library binding to Whisper, handle temp files, cleanup.
   - Design a queuing mechanism to prevent concurrent Whisper invocations beyond capacity. Explain using BullMQ or a simple in-process queue.
   - Logging: structured logs (request ID, session ID, chunk index, latency), without logging raw audio.
   - Monitoring: integrate Prometheus metrics for transcription latency and error counts.
   - Error handling: structured error responses, retries.
   - Security: Helmet, CORS, rate-limiting, input validation, secure temp file handling, sanitize transcript text.
   - Testing: show unit-test examples (e.g., with Jest for Node, pytest for Python), integration test approach with sample WAV fixtures.
   - Documentation: generate README section, sample curl commands, environment setup (install FFmpeg, Python dependencies or Node wrappers), GPU considerations.

3. Project Structure:
   - Define directory layout for this module: e.g.,
     
     pollgen-transcription/
     ├── src/
     │   ├── controllers/
     │   ├── services/
     │   ├── middlewares/
     │   ├── utils/
     │   ├── config/
     │   ├── routes/
     │   └── index.ts
     ├── tests/
     │   ├── unit/
     │   └── integration/
     ├── Dockerfile
     ├── docker-compose.yml (if including Python service)
     ├── .env.example
     ├── README.md
     └── package.json
     
   - For Python alternative: similar layout with FastAPI, scripts to launch uvicorn with GPU.

4. Deployment & DevOps Notes:
   - Provide a Dockerfile for Node.js service; optionally a second for Python Whisper service.
   - Describe how to deploy on a VM or Kubernetes cluster with GPU: mounting GPU, environment variables, scaling considerations.
   - CI/CD pipelines: lint, test, build container images, push to registry.
   - Health-check endpoints and readiness probes.
   - Monitoring: Prometheus exporters, log aggregation.

5. Security & Compliance:
   - Outline how to secure secrets (use environment variables or vault).
   - Ensure HTTPS enforcement, UI only served over TLS.
   - Explain rate-limiting logic to prevent abuse.
   - Data privacy: raw audio should not be stored long-term; transcripts may be stored but consider encryption at rest if needed.
   - CORS: restrict origins to PollGen frontend.
   - Detailed instructions for sanitizing and validating all inputs/outputs.

6. Testing & Quality Assurance:
   - Unit tests for frontend hook: can simulate MediaRecorder by mocking or using test audio. 
   - Unit tests for backend validation and service layer: mock Whisper to return known output.
   - Integration tests: use a small Whisper model or a dummy stub in CI to test end-to-end chunk upload -> transcript result.
   - Load testing guidelines: use tools like k6 or JMeter to simulate many concurrent chunk uploads.
   - Linting and formatting: ESLint/Prettier, tsconfig with strict flags, black/flake8 for Python.

7. Documentation & Examples:
   - README snippet showing how to run locally, env setup (e.g., installing ffmpeg: `apt-get install ffmpeg` or Mac brew).
   - Sample front-end code snippet: how to invoke hook, display results.
   - Sample backend logs example.
   - Troubleshooting common errors: GPU OOM, model loading failures.

8. Extensibility:
   - Show how to swap Whisper model for another (e.g., a cloud-based speech API) with minimal code changes: abstract transcription interface.
   - Plan for future streaming mode (WebSocket) if low-latency streaming transcription is desired.
   - Provide interfaces/types so downstream modules (e.g., LLM question generator) can consume transcripts cleanly.

**Formatting Guidelines for Generated Output**  
- Use modern ES modules syntax in TypeScript.  
- Follow consistent naming conventions (camelCase for variables/functions, PascalCase for types/classes).  
- Include JSDoc/type hints.  
- Use async/await.  
- Proper error classes or error-handling utilities.  
- Use dependency injection or inversion of control where appropriate (e.g., pass model loader into service).  
- Modular, small functions; single responsibility principle.  
- Comments to explain non-obvious parts (e.g., WAV packaging in JS).  
- No use of deprecated APIs.  
- Use latest stable releases of libraries as of mid-2025 (e.g., React 19, Node 20+, TypeScript 5.x, FastAPI latest, PyTorch/Whisper latest).  
- For Python: use `async def` endpoints in FastAPI, proper uvicorn/gunicorn worker config for GPU.

**Example Starting Section for Frontend Hook** (to guide AI):  
ts
// src/hooks/useSpeechRecorder.ts
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Define types
interface TranscriptSegment {
  id: string;
  seek: number;
  start: number;
  end: number;
  text?: string;
  status: 'pending' | 'transcribing' | 'done' | 'error';
  errorMessage?: string;
}

// Hook signature
export function useSpeechRecorder(options?: { chunkDurationSec?: number; sampleRate?: number }) {
  // Implementation: request mic permission, create MediaRecorder or AudioContext, chunking logic...
  // ...
}
`

*(Continue with full implementation based on industry best practices.)*

**Example Starting Section for Backend (Node + TypeScript)**:

ts
// src/index.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { transcribeRouter } from './routes/transcribe';
import { config } from './config';
import logger from './utils/logger';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.ALLOWED_ORIGINS.split(',') }));
app.use(express.json({ limit: ${config.CHUNK_MAX_SIZE_MB}mb }));

const limiter = rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, max: config.RATE_LIMIT_MAX });
app.use(limiter);

app.use('/api/transcribe', transcribeRouter);

app.listen(config.PORT, () => {
  logger.info(Transcription service listening on port ${config.PORT});
});
```

(Continue with middleware, controller, service layers.)

---

### 5. 💡 *Usage Instructions to AI Model*

* *Role*: “You are an expert full-stack engineer specialized in real-time audio processing and transcription. Generate code, configuration, and docs as specified.”
* *Tone*: Clear, concise, explanatory comments.
* *Output Format*: Provide file/directory structure, then code files with annotations. Use Markdown code blocks labeled with file paths. Include README content in Markdown. Provide test examples.
* *Assumptions*:

  * Whisper or equivalent model binaries are available on the server with GPU.
  * Frontend runs in modern browsers (Chrome, Firefox, Edge) supporting required Web APIs.
  * Authentication system already exists; use JWT verification stub or integrate with existing auth.
* *Constraints*:

  * Avoid external paid cloud services for transcription; focus on open-source Whisper-based setup.
  * Keep payload sizes reasonable.
  * Ensure no blocking operations on main event loop; use async patterns.
* *Deliverables*:

  * Frontend hook and example integration components.
  * Backend service with full folder layout, configuration, and scripts (e.g., npm run start, docker-compose up).
  * Testing code.
  * Dockerfile(s) with GPU support notes.
  * README.md excerpt for speech-to-text module.
  * Comments on how to integrate into the larger PollGen application.

---

### 6. 📦 *Putting It All Together*

When you run this prompt through an AI model, expect it to output:

* A *folder structure* for pollgen-transcription module.
* *TypeScript files*: hooks, routes, controllers, services, utils.
* *Python files* (if using Python service) for transcription: FastAPI app, model loader.
* *Dockerfiles*: Node service and/or Python service with GPU setup hints.
* *.env.example*: clearly listing required variables.
* *README.md*: describing setup, usage, testing, deployment.
* *Test suites*: Jest or pytest code.
* *Prometheus metrics integration* code snippets.
* Explanations in comments about why certain decisions are made (e.g., chunk size, queueing).
* Optionally, a brief text “architecture diagram” description (ASCII or text) illustrating frontend → backend → Whisper GPU → results → UI.

---


🚀 Quick Whisper Setup (Windows + VS Code)

📁 This project includes a script and dependencies to install OpenAI Whisper with FFmpeg on Windows in just a few steps.

🧰 1. Requirements
- Python 3.9 or newer
- Git
- Admin rights to edit system PATH
- VS Code (optional, but recommended)

📦 2. One-Time Setup (Manual OR Auto)

🧠 Option A: Manual Setup (Click to Expand)
--------------------------------------------

Follow the steps below to set up the environment for OpenAI Whisper on a Windows machine.

1. Python Installation
   - Download Python from: https://www.python.org/downloads/
   - Check "Add Python to PATH" during install
   - Verify: python --version

2. Create Virtual Environment
   - python -m venv whisper_env
   - whisper_env\Scripts\activate

3. Upgrade pip
   - python -m pip install --upgrade pip

4. Install FFmpeg
   - Download from: https://www.gyan.dev/ffmpeg/builds/
   - Extract to C:\ffmpeg
   - Add C:\ffmpeg\bin to System PATH via Environment Variables
   - Verify: ffmpeg -version

5. Install Whisper
   - pip install git+https://github.com/openai/whisper.git

6. Test
   - whisper example.mp3 --model base --output_format txt

🛠️ Optional: Torch with GPU (CUDA)
   - pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

⚡ Option B: Auto-Install (PowerShell)
--------------------------------------

1. Clone the repo
   git clone https://github.com/yourusername/yourproject.git
   cd yourproject

2. Run the installer (PowerShell as Admin)
   Set-ExecutionPolicy Bypass -Scope Process -Force
   .\setup_whisper.ps1

📂 Script will:
- Create a virtual environment
- Install FFmpeg and set PATH
- Install Whisper

📁 3. File Structure

yourproject/
│
├── setup_whisper.ps1       # PowerShell auto-installer
├── requirements.txt        # Whisper + Torch dependencies
├── example.mp3             # Sample audio file (optional)
└── ...

📃 4. requirements.txt

git+https://github.com/openai/whisper.git
torch

💻 5. VS Code Integration

- Install VS Code from: https://code.visualstudio.com
- Open folder in VS Code
- Ctrl + Shift + P → Python: Select Interpreter → choose whisper_env

Add .vscode/settings.json:

{
  "python.pythonPath": "whisper_env\\Scripts\\python.exe"
}

🧪 6. Run a Sample Transcription

whisper example.mp3 --model base --output_format txt

✅ Final Checklist

| Task                        | Status |
|-----------------------------|--------|
| Python 3.9+ Installed       | ✅     |
| Virtual Environment Ready   | ✅     |
| FFmpeg Installed & in PATH | ✅     |
| Whisper Installed           | ✅     |
| Test Run Successful         | ✅     |

#### 🔚 *End of Prompt*

Feed the above structured prompt to your chosen AI model. It should generate a comprehensive speech-to-text module for PollGen that you can refine further. Let me know if you need adjustments or want example snippets expanded.
