# In-Memory Meeting Connections Store

This document describes the in-memory meeting connections store implemented in `apps/backend/src/transcription/services` for the `poll-automation` monorepo. The store manages WebSocket connections for real-time audio transcription, tracking clients by `meetingId`, `speakerId`, and `role` (`host` or `participant`). It is part of the Node.js backend (`apps/backend`) and integrates with the Faster Whisper service (`services/whisper`) and AI module (`services/pollgen-llm`).

## Overview

The in-memory connections store (`src/transcription/services/connections.ts`) is a lightweight solution for Phase 1, designed to:
- Track active WebSocket clients in meetings.
- Support host/participant categorization for transcription routing.
- Enable broadcasting of transcription results to meeting participants.
- Prepare for integration with the AI module for live poll generation.

The store uses a `Map` structure and is planned to be replaced with MongoDB or Redis in Phase 2 for scalability.

## Project Structure

```
apps/backend/
├── src/
│   ├── transcription/
│   │   ├── services/
│   │   │   ├── connections.ts    # In-memory meeting connections store
│   │   │   └── whisperWebSocket.ts # WebSocket client for Faster Whisper
│   │   ├── routes/
│   │   └── ws/
│   ├── websocket/
│   │   ├── connection.ts         # WebSocket server initialization
│   │   └── handlers.ts           # WebSocket message handling
│   ├── web/
│   ├── __tests__/
│   └── index.ts
├── README.md                     # Backend README (references this file)
└── package.json
```

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Turborepo**: Installed globally (`pnpm add -g turbo`)
- **Monorepo Setup**: Clone the `poll-automation` monorepo and run `pnpm install` in the root.

## Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-org/poll-automation.git
   cd poll-automation
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the Backend**:
   ```bash
   pnpm --filter @poll-automation/backend run dev
   ```
   Or locally in `apps/backend`:
   ```bash
   cd apps/backend
   pnpm run dev
   ```

## Usage

The connections store is used by the WebSocket server (`src/websocket/connection.ts`) to manage client connections:

- **Adding a Connection**: When a client connects and sends a `ConnectionMessage` (e.g., `{ type: "connection", meetingId: "123", speakerId: "user1", role: "host" }`), the store adds the client to the `meetingConnections` Map.
- **Removing a Connection**: On WebSocket `close` or `error`, the store removes the client using `meetingId` and `speakerId`.
- **Broadcasting Transcriptions**: Transcription results from Faster Whisper are broadcast to all clients in a meeting using `broadcastToMeeting`.

### Example Workflow

1. A client connects to the WebSocket server (`ws://localhost:3000`).
2. The client sends a `ConnectionMessage` to register with a `meetingId`, `speakerId`, and `role`.
3. The server calls `addConnection(ws, meetingId, speakerId, role)` to store the client.
4. When an `AudioChunkMessage` is received, the server forwards it to Faster Whisper (`ws://localhost:8000/transcribe`).
5. Transcription results are broadcast to all clients in the meeting using `broadcastToMeeting`.

## API

The connections store provides the following functions in `src/transcription/services/connections.ts`:

- **`addConnection(ws: WebSocket, meetingId: string, speakerId: string, role: SpeakerRole)`**:
  Adds a WebSocket client to the store for a specific meeting and speaker.
- **`removeConnection(meetingId: string, speakerId: string)`**:
  Removes a client from the store.
- **`getMeetingConnections(meetingId: string)`**:
  Returns a `Map` of all connections for a meeting.
- **`getConnection(meetingId: string, speakerId: string)`**:
  Retrieves a specific client’s connection details.
- **`broadcastToMeeting(meetingId: string, message: string)`**:
  Sends a message (e.g., transcription) to all clients in a meeting.

## Types

The store uses types defined in `shared/types/src/websocket.ts`:

```typescript
export type SpeakerRole = 'host' | 'participant';

export interface ConnectionMessage {
  type: 'connection';
  meetingId: string;
  speakerId: string;
  role: SpeakerRole;
}

export interface AudioChunkMessage {
  type: 'audio_chunk';
  meetingId: string;
  speakerId: string;
  speaker: SpeakerRole;
  audio: string; // base64 encoded
  timestamp: number;
}

export interface TranscriptionMessage {
  type: 'transcription';
  meetingId: string;
  speakerId: string;
  speaker: SpeakerRole;
  text: string;
  timestamp: number;
}
```

## Integration

- **WebSocket Server (`src/websocket/connection.ts`)**:
  Initializes the WebSocket server and handles `ConnectionMessage` to add clients to the store. Cleans up connections on `close` or `error` events.
- **Message Handlers (`src/websocket/handlers.ts`)**:
  Processes `AudioChunkMessage` and uses `broadcastToMeeting` to send transcriptions.
- **Faster Whisper Service (`services/whisper`)**:
  Receives audio chunks via WebSocket and returns transcriptions, which are broadcast to meeting clients.
- **AI Module (`services/pollgen-llm`)**:
  Planned for Phase 3 to receive transcription streams for live poll generation, using `meetingId` and `role` for context.

## Testing

Unit tests for the connections store are in `apps/backend/src/__tests__/connections.test.ts`:

```bash
pnpm --filter @poll-automation/backend run test
```

Tests cover:
- Adding and retrieving connections.
- Removing connections.
- Broadcasting messages to meeting clients.

## Collaboration Guidelines

To avoid conflicts with the web app team in `apps/backend`:
- **Modular Code**: Keep transcription-related code in `src/transcription` and `src/websocket`, separate from `src/web`.
- **Dependencies**: Propose new dependencies (e.g., `ws`) via team channels or GitHub issues.
- **PR Reviews**: Include both transcription and web app teams in PRs affecting `src/index.ts`, `package.json`, or `shared/types`.
- **Types**: Update `shared/types` collaboratively to ensure compatibility.

## Limitations

- **Scalability**: The in-memory `Map` is suitable for Phase 1 but will be replaced with MongoDB or Redis in Phase 2 for distributed systems.
- **Persistence**: No persistent storage; connections are lost on server restart.
- **Health Checking**: WebSocket `ping/pong` ensures clean connections, but additional monitoring may be needed in production.

## Troubleshooting

- **Connection Not Found**: Verify clients send a valid `ConnectionMessage` on WebSocket connection.
- **Broadcast Failures**: Check `ws.isAlive` in `broadcastToMeeting` and ensure WebSocket health checks are active.
- **Type Errors**: Confirm `shared/types/src/websocket.ts` aligns with `connections.ts` usage.
- **Turborepo Issues**: Run `pnpm install` in the monorepo root to sync dependencies.

## Contributing

- Create feature branches off `development` (e.g., `git checkout -b sarthak/connections-update`).
- Submit PRs to `development` with clear descriptions, tagging both transcription and web app teams.
- Run `pnpm run lint` and `pnpm run test` before submitting PRs.
- Update this README for new features or changes.

## License

Internal use only. Contact the project maintainers for details.
