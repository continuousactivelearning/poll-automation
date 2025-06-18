# Poll Automation App

Poll Automation App is a standalone, open-source web application designed to intelligently generate and manage live polls in real-time during lectures, webinars, or meetings — without being tied to any specific video conferencing platform.

## 📁 Monorepo Folder Structure (Turborepo)

```
poll-automation/
├── apps/
│   ├── frontend/         # Vite React TypeScript frontend
│   └── backend/          # Express/Vite backend
├── services/
│   ├── whisper/          # Python service for audio transcription (Whisper)
│   └── pollgen-llm/      # Poll generation logic using API/Local LLMs
├── shared/
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utility functions
├── .github/
│   └── workflows/        # CI/CD pipelines
├── package.json          # Root config with workspaces
├── turbo.json            # Turborepo pipeline config
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### 🔧 Python Environment Setup

1. **Navigate to the Whisper service folder:**

```bash
cd services/whisper
```

2. **Create and activate a Python virtual environment:**

```bash
# Windows
python -m venv whisper-env
whisper-env\Scripts\activate

# macOS/Linux
python3 -m venv whisper-env
source whisper-env/bin/activate
```

3.1 **For CPU-only**

```bash
pip install --upgrade pip
pip install -r requirements.txt
````

This installs everything except large GPU-related packages like `torch`.
Useful for quickly running the backend in **CPU mode** for testing or development.


3.2 **⚡ For GPU support (CUDA 12.1)**

If you have a CUDA-enabled GPU and want to use GPU acceleration:

```bash
pip install -r requirements.gpu.txt --extra-index-url https://download.pytorch.org/whl/cu121
```

This will install `torch`, `torchaudio`, and `torchvision` with CUDA 12.1 support.
Make sure your system has the correct CUDA runtime installed.


## 🔧 .env Configuration

### `apps/backend/.env`

```
PORT=3000
WHISPER_WS_URL=ws://localhost:8000
```

### `apps/frontend/.env`

```
VITE_BACKEND_WS_URL=ws://localhost:3000
```

### Global Prerequisites
**Navigate to the root directory:**

Install `pnpm` and `turbo` globally (once):

```bash
npm install -g pnpm
pnpm add -g turbo
```
### 1. Install dependencies

```bash
pnpm install
```

### 2. Start all dev servers

```bash
pnpm dev
```
This starts:

* ✅ *Frontend* → [http://localhost:5173](http://localhost:5173)
* ✅ *Backend (WebSocket server)* → ws\://localhost:3000
* ✅ *Whisper Transcription Service* → ws\://localhost:8000 (Python FastAPI)

> Make sure the Python environment is set up correctly (faster-whisper, uvicorn, etc.)

## 🛆 Using Turborepo

* `pnpm build` → Build all apps/services
* `pnpm lint` → Lint all projects
* `pnpm test` → Run tests
* `turbo run <task>` → Run any task across monorepo


## 🗣 Phase 1 – Transcription Pipeline

> This outlines the current real-time transcription flow:

1. **Frontend** records or selects a `.wav` file and sends it over WebSocket (binary + metadata).
2. **Backend** WebSocket server receives and forwards it to the Whisper service.
3. **Whisper Service** processes audio using Faster-Whisper and returns transcription in JSON.
4. **Backend** sends transcription JSON back to the frontend or passes it to the LLM service.

> Currently, the transcription is **not displayed** to the user – it is **used internally** to generate polls using an LLM.

📅 Upcoming Phases:

* Phase 2: LLM-based Poll Generation
* Phase 3: Realtime Poll Launch and Analytics

