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

bash
```
npm install -g pnpm
pnpm add -g turbo
```
Check versions:

bash
```
pnpm -v
turbo --version
```

### 1. Install Dependencies


bash
```
pnpm install
```

### 2. Run All Dev Servers (Frontend + Backend)

```bash
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

