# Poll Automation App

Poll Automation App is a standalone, open-source web application designed to intelligently generate and manage live polls in real-time during lectures, webinars, or meetings — without being tied to any specific video conferencing platform.

---

## 📁 Monorepo Folder Structure (Turborepo)

\`\`\`
poll-automation/
├── apps/
│   ├── frontend/         # Vite React TypeScript frontend
│   └── backend/          # Express/Vite backend
├── services/
│   ├── whisper/          # Python service for audio transcription (Whisper)
│   └── pollgen-llm/      # Poll generation logic using API/Local LLMs
│       └── src/
│           └── cron/     # ⏰ Cron job for transcript polling
├── shared/
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utility functions
├── .github/
│   └── workflows/        # CI/CD pipelines
├── package.json
├── turbo.json
├── .gitignore
└── README.md
\`\`\`

---

## 🚀 Getting Started

### 🔧 Python Environment Setup (Whisper Service)

1. Navigate to the Whisper service folder:
\`\`\`bash
cd services/whisper
\`\`\`

2. Create and activate a Python virtual environment:
\`\`\`bash
# Windows
python -m venv whisper-env
whisper-env\\Scripts\\activate

# macOS/Linux
python3 -m venv whisper-env
source whisper-env/bin/activate
\`\`\`

3.1 Install CPU-only dependencies:
\`\`\`bash
pip install --upgrade pip
pip install -r requirements.txt
\`\`\`

3.2 For GPU support (CUDA 12.1):
\`\`\`bash
pip install -r requirements.gpu.txt --extra-index-url https://download.pytorch.org/whl/cu121
\`\`\`

---

## 🔧 .env Configuration

### apps/backend/.env
\`\`\`
PORT=3000
WHISPER_WS_URL=ws://localhost:8000
\`\`\`

### apps/frontend/.env
\`\`\`
VITE_BACKEND_WS_URL=ws://localhost:3000
\`\`\`

---

## 📦 Global Prerequisites

\`\`\`bash
npm install -g pnpm
pnpm add -g turbo
\`\`\`

---

## 📥 Install All Dependencies

\`\`\`bash
pnpm install
\`\`\`

---

## 🧪 Run All Dev Servers

\`\`\`bash
pnpm dev
\`\`\`

Starts:
- ✅ Frontend → http://localhost:5173  
- ✅ Backend (WebSocket) → ws://localhost:3000  
- ✅ Whisper Service (Python) → ws://localhost:8000  

---

## 🔁 Transcript Cron Job (pollgen-llm)

📄 Location: \`services/pollgen-llm/src/cron/fetchTranscript.ts\`

This cron job simulates fetching transcripts every 2 minutes using \`node-cron\`.

### Features:
- Logs mock transcript to console
- Uses \`chalk\` for colored terminal output

### Run it with:
\`\`\`bash
pnpm dev -F pollgen-llm
\`\`\`

Make sure \`src/index.ts\` includes:
\`\`\`ts
import "./cron/fetchTranscript";
\`\`\`

---

## 🗣 Phase 1 – Transcription Pipeline

1. Frontend sends audio via WebSocket  
2. Backend receives and forwards to Whisper  
3. Whisper transcribes and sends back JSON  
4. LLM (next phase) turns transcripts into polls

📅 Future Phases:
- Poll Generation
- Real-time Poll Launch & Analytics

---

## 📌 Notes

- Monorepo powered by \`pnpm\` + \`turborepo\`
- Modular architecture
- CI/CD-ready with GitHub Actions
