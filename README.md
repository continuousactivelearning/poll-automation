# Poll Automation App

Poll Automation App is a standalone, open-source web application designed to intelligently generate and manage live polls in real-time during lectures, webinars, or meetings — without being tied to any specific video conferencing platform.

---

## 📁 Project Structure (Turborepo Monorepo)

\`\`\`
├── apps
│   ├── backend                 # Express/Vite backend
│   └── frontend                # Vite React TypeScript frontend
├── services
│   ├── pollgen-llm            # Poll generation logic using API/Local LLMs
│   │   ├── src
│   │   │   ├── cron           # ⏰ Cron job for transcript polling
│   │   │   │   ├── fetchTranscript.ts
│   │   │   │   └── README.md
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── pnpm-lock.yaml
│   │   ├── tsconfig.json
│   │   └── types.d.ts
│   └── whisper                # Python service for audio transcription (Whisper)
├── shared
│   ├── types                  # Shared TypeScript types
│   └── utils                  # Shared utility functions
├── package.json               # Root config with workspaces
├── pnpm-lock.yaml
├── turbo.json                 # Turborepo pipeline config
└── README.md
\`\`\`

---

## 🚀 Getting Started

### 📦 Prerequisites

Install `pnpm` and `turbo` globally:

\`\`\`bash
npm install -g pnpm
pnpm add -g turbo
\`\`\`

Check versions:

\`\`\`bash
pnpm -v
turbo --version
\`\`\`

---

### 📥 Install All Dependencies

\`\`\`bash
pnpm install
\`\`\`

---

### 🧪 Run All Dev Servers (Frontend + Backend)

\`\`\`bash
pnpm dev
\`\`\`

> Each app/service must have its own `dev` script in its `package.json`.

---

## 📦 Using Turborepo

- \`pnpm build\` → Build all apps/services  
- \`pnpm lint\` → Lint the entire workspace  
- \`pnpm test\` → Run all tests  
- \`turbo run <task>\` → Run specific task across the workspace

---

## 🔁 Transcript Cron Job (pollgen-llm)

Located at:  
\`services/pollgen-llm/src/cron/fetchTranscript.ts\`

This script simulates fetching transcript content every 2 minutes using `node-cron`.

### 📌 Features

- Scheduled every 2 minutes
- Logs mock transcript text to the console
- Uses `chalk` for colored output

### ▶️ How to Run

From the root:

\`\`\`bash
pnpm dev -F pollgen-llm
\`\`\`

Ensure the entry file includes:

\`\`\`ts
import './cron/fetchTranscript';
\`\`\`

### 🔮 What's Next

- Connect with actual Whisper APIs
- Chain transcript → LLM poll generation
- Store in DB or forward to backend

---

## 📌 Notes

- Modular monorepo built with `pnpm` + `Turborepo`
- AI-first architecture with reusable services
- CI/CD support via `.github/workflows/`

---


