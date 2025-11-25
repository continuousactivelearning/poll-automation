# Backend

Node.js backend with Express and TypeScript for the Poll Automation project. This module handles real-time audio transcription (integrating with the Whisper service) and web app APIs (serving the frontend). It is part of the `poll-automation` monorepo and uses pnpm for package management and Turborepo for build orchestration.

## Backend (`apps/backend`)
- Node.js with Express and TypeScript.
- Handles transcription (Whisper integration) and web app APIs.
- See `apps/backend/README.md` for details.

## Overview

The backend is located in `apps/backend` and serves two primary purposes:
- **Transcription Module**: Manages real-time audio transcription via WebSocket, integrates with the Whisper service (`services/whisper`), and streams transcriptions to the AI module (`services/pollgen-llm`) for live poll generation.
- **Web App Module**: Provides REST APIs for the frontend (`apps/frontend`), handling user-facing functionality.

Both teams (transcription and web app) share this backend, using a modular structure to avoid conflicts.

## Project Structure

```
apps/backend/
├── src/
│   ├── transcription/        # Transcription module (real-time audio, Whisper integration)
│   │   ├── routes/           # Express routes (e.g., /transcription/*)
│   │   ├── ws/               # WebSocket logic for audio streaming
│   │   ├── services/         # Services for Whisper, MQ, etc.
│   │   └── index.ts          # Transcription entry point
│   ├── web/                  # Web app module (frontend APIs)
│   │   ├── routes/           # Express routes (e.g., /api/*)
│   │   └── index.ts          # Web app entry point
│   ├── common/               # Shared utilities (e.g., logging, error handling)
│   └── index.ts              # Main Express server
├── __tests__/                # Unit and integration tests
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # pnpm workspace config
├── pnpm-lock.yaml            # pnpm lockfile (managed at monorepo root)
└── README.md                 # This file
```

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Turborepo**: Installed globally (`pnpm add -g turbo`)
- **Monorepo Setup**: Ensure the `poll-automation` monorepo is cloned and dependencies are installed (`pnpm install` in root).

## Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-org/poll-automation.git
   cd poll-automation
   ```

2. **Install Dependencies**:
   - From the monorepo root:
     ```bash
     pnpm install
     ```

3. **Run the Backend**:
   - For the transcription module:
     ```bash
     pnpm --filter @poll-automation/backend run dev:transcription
     ```
   - For the web app module (placeholder):
     ```bash
     pnpm --filter @poll-automation/backend run dev:web
     ```
   - Alternatively, run locally in `apps/backend`:
     ```bash
     cd apps/backend
     pnpm run dev
     ```

4. **Build the Backend**:
   ```bash
   pnpm --filter @poll-automation/backend run build
   ```

5. **Lint and Format**:
   ```bash
   pnpm --filter @poll-automation/backend run lint
   pnpm --filter @poll-automation/backend run format
   ```

6. **Run Tests**:
   ```bash
   pnpm --filter @poll-automation/backend run test
   ```

## Available Routes

- **Health Check**: `GET /health` - Returns `{ status: "OK" }`
- **Transcription Routes**: `GET /transcription/*` - Handles transcription-related endpoints (e.g., `/transcription/test`)
- **Web App Routes**: `GET /api/*` - Web app APIs (e.g., `/api/test`)

## Environment Variables

Create a `.env` file in `apps/backend` (ignored by `.gitignore`):

```env
PORT=3000
WHISPER_API_URL=http://localhost:8000/transcribe
```

- `PORT`: Backend server port.
- `WHISPER_API_URL`: URL for the Whisper service’s `/transcribe` endpoint.

## Development Workflow

- **Turborepo**: Use `--filter @poll-automation/backend` to run commands specific to this workspace.
- **pnpm**: Install dependencies with `pnpm add <package> --filter @poll-automation/backend`.
- **Git**:
  - Work in feature branches (e.g., `git checkout -b sarthak/backend-init`).
  - Create PRs to the `development` branch.
  - Review PRs with both transcription and web app teams to avoid conflicts in `package.json` or `src`.

## Collaboration Guidelines

Since both transcription and web app teams work in `apps/backend`, follow these practices:
- **Modular Code**:
  - Transcription team: Use `src/transcription` for routes, WebSocket, and services.
  - Web app team: Use `src/web` for APIs.
  - Shared utilities go in `src/common`.
- **Dependencies**:
  - Propose new dependencies in a team channel or GitHub issue.
  - Use `workspace:*` for monorepo packages (e.g., `@poll-automation/types`).
- **Scripts**:
  - Use `dev:transcription` and `dev:web` to avoid runtime conflicts.
  - Shared scripts (`build`, `lint`, `test`) are for both teams.
- **Types**:
  - Define shared interfaces in `shared/types` (e.g., `AudioChunk`, `TranscriptionResult`).
  - Import with `import { AudioChunk } from '@poll-automation/types'`.

## Integration with Other Services

- **Whisper Service (`services/whisper`)**:
  - Communicates via HTTP (`/transcribe` endpoint) in Phase 1, transitioning to MQ (Kafka/RabbitMQ) in Phase 2.
  - Expects base64-encoded audio chunks; returns transcriptions with timestamps.
- **AI Module (`services/pollgen-llm`)**:
  - Receives real-time transcription streams via WebSocket or MQ in Phase 3.
  - Uses `shared/types` for data contracts.

## Testing

- **Unit Tests**: Located in `__tests__`, using Jest.
- **Integration Tests**: Planned for Phase 2 to cover Node.js ↔ Whisper ↔ MQ flows.
- Run tests:
  ```bash
  pnpm --filter @poll-automation/backend run test
  ```

## Troubleshooting

- **pnpm Errors**: Run `pnpm install` in the monorepo root to sync dependencies.
- **Turborepo Issues**: Check `turbo.json` for correct pipelines.
- **TypeScript Errors**: Verify `tsconfig.json` paths for `@poll-automation/types`.
- **Whisper Integration**: Ensure the Whisper service is running at `WHISPER_API_URL`.

## Contributing

- Create feature branches off `development`.
- Submit PRs with clear descriptions, tagging both transcription and web app teams for review.
- Follow ESLint and Prettier rules (`pnpm run lint`, `pnpm run format`).
- Update this README for new features or changes.

## License

Internal use only. Contact the project maintainers for details.