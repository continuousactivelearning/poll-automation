# Poll Automation App

Poll Automation App is a standalone, open-source web application designed to intelligently generate and manage live polls in real-time during lectures, webinars, or meetings — without being tied to any specific video conferencing platform.

---

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

---

## 🚀 Getting Started

### Global Prerequisites

Install `pnpm` and `turbo` globally (once):


```
npm install -g pnpm
pnpm add -g turbo
```
Check versions:


```
pnpm -v
turbo --version
```

### 1. Install Dependencies



```
pnpm install
```

### 2. Run All Dev Servers (Frontend + Backend)


pnpm dev
```

*(Make sure each app has its own `dev` script defined in its `package.json`)*

---

## 📦 Using Turborepo

* `pnpm build` → Build all apps/services
* `pnpm lint` → Lint all projects
* `pnpm test` → Run tests
* `turbo run <task>` → Run any task across monorepo

---

## 📌 Notes

* Powered by `pnpm` workspaces + `Turborepo`
* Modular folder structure for scalable dev
* Each service/app can run independently or be combined via CI/CD
---
###
```
## 🧠 `services/whisper/` – Faster Whisper Setup (Audio Transcription)

This guide helps you set up Whisper or Faster-Whisper in a Python environment on Windows, allowing you to transcribe audio files using the model locally.

📦 1. Requirements
Python 3.8 or higher

Git (if using OpenAI Whisper)

FFmpeg (for audio decoding)

Recommended: Virtual environment

---

This Python service uses [Faster-Whisper](https://github.com/guillaumekln/faster-whisper) for real-time transcription of meeting audio using Whisper models optimized via CTranslate2.

### 🔧 Python Environment Setup

1. **Navigate to the Whisper service folder:**

```bash
cd services/whisper
```

2. **Create a Python Virtual Environment:**

```bash
# Windows
python -m venv whisper-env
whisper-env\Scripts\activate

# macOS/Linux
python3 -m venv whisper-env
source whisper-env/bin/activate
```

3. **Upgrade pip and install dependencies:**

```bash
pip install --upgrade pip
pip install faster-whisper
```

4. **Test Installation:**

Run a quick test script (optional):

```python
# test_whisper.py
from faster_whisper import WhisperModel

model = WhisperModel("base", compute_type="float32")
segments, _ = model.transcribe("sample-audio.mp3")

for segment in segments:
    print(f"[{segment.start:.2f} -> {segment.end:.2f}] {segment.text}")
```

Then run it:

```bash
python test_whisper.py
```

5. **Model Download Note:**

The first time you run, the model (e.g., `"base"`) will download from HuggingFace. You can also download manually or cache using:

```bash
from faster_whisper import WhisperModel
model = WhisperModel("base", download_root="./models")
```

6. **Recommended GPU Setup (Optional):**

To leverage GPU and faster inference:

```bash
# Float16 for GPU (if supported)
model = WhisperModel("base", compute_type="float16")
```

---
