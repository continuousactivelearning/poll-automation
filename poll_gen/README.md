# 🎙️ PollGen — Real Time AI Poll Generation for meetings

PollGen is a real-time audio transcription tool powered by OpenAI Whisper. It allows hosts (e.g., teachers) to record their voice during meetings or classes, transcribe the audio into text, and eventually (in upcoming features) generate interactive polls based on that transcript. It uses a MERN stack enhanced with TypeScript, React Query, and Whisper (via Python).

---

## 🚀 Features

- 🎧 Audio recording (WebM)
- 📝 Real-time transcription using Whisper (local)
- 📦 Modular MERN + TS architecture
- 📄 Transcript preview and endpoint access
- 🌐 Clean, cross-platform startup script (Windows/Linux/Mac)
- 📊 Future-ready for LLM-based MCQ generation

---


## Setup Instructions

Follow the steps below to run both the server and client for the project:

### 📌 Prerequisites
Ensure the following tools are installed:

- Node.js (v18+ recommended)
- Python (v3.8+)
- FFmpeg (ensure it’s added to your system PATH)
- Git
---
## 🧩 Planned Features

- [x] 🎙️ Whisper (base) model integration for audio transcription
- [x] 📁 Server-side transcript storage and retrieval API
- [x] 🎥 Real-time audio recording and upload from client
- [ ] ⚡ Unified script to auto-setup server + client on Windows/Mac/Linux
- [ ] 🎯 Whisper model switch (base → higher models)
- [ ] 🤖 LLM-based poll generation
- [ ] 📊 Dashboard for host/admin roles
- [ ] 📊 MCQ dashboard for student roles
- [ ] 📊 Poll Result calculation and statistics
- [ ] 🔒 Auth (JWT or session-based login)
- [ ] 🧪 Unit tests & test coverage
- [ ] Chunking Strategy
- [ ] Higher model integration
- [ ] Compatibility testing

---


