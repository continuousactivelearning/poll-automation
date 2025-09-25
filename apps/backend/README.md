# Poll Automation Backend

Node.js backend server for the Poll Automation project built with Express.js, TypeScript, and MongoDB. This backend serves as the central hub for the polling system, handling real-time transcription, poll management, user authentication, and WebSocket communications.

## 🏗️ Architecture Overview

The backend is designed with a modular architecture supporting multiple communication protocols:

- **HTTP REST API**: Standard web application endpoints
- **Socket.IO**: Real-time poll management and student interactions
- **WebSocket**: Audio transcription streaming
- **MongoDB**: Data persistence with real-time change monitoring

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── index.ts                  # Main server entry point
│   ├── server.ts                 # HTTP server setup
│   ├── services/                 # Business logic services
│   │   ├── llm-forwarder.ts     # LLM service integration
│   │   ├── mongoChangeWatcher.ts # MongoDB change streams
│   │   └── mongoPollingWatcher.ts# Poll state monitoring
│   ├── web/                      # Web application module
│   │   ├── config/              # Database configuration
│   │   ├── controllers/         # Request handlers
│   │   ├── middlewares/         # Express middlewares
│   │   ├── models/              # MongoDB models
│   │   └── routes/              # API route definitions
│   ├── websocket/               # Socket.IO implementation
│   │   └── studentWebSocket.ts  # Real-time poll interactions
│   └── ws/                      # WebSocket implementation
│       └── ws-server.ts         # Audio transcription WebSocket
├── scripts/                     # Utility scripts
├── uploads/                     # File upload storage
│   └── avatars/                # User avatar images
├── test-client.ts              # WebSocket test client
└── test-client-streaming.ts    # Streaming test client
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- MongoDB instance (local or remote)
- pnpm package manager

### Installation

1. **Install dependencies** (from monorepo root):

   ```bash
   pnpm install
   ```

2. **Environment setup** - Create `.env` file in `apps/backend/`:

   ```env
   # Server Configuration
   BACKEND_HTTP_PORT=3000
   PORT=3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/pollgen
   MONGO_URI=mongodb://localhost:27017/pollgen

   # External Services
   WHISPER_WS_URL=ws://localhost:8000
   LLM_FORWARD_URL=ws://localhost:5001/ws/llm

   # Security (for production)
   JWT_SECRET=your-jwt-secret-here
   BCRYPT_ROUNDS=12
   ```

### Running the Server

**Development mode:**

```bash
cd apps/backend
pnpm run dev
```

**Production mode:**

```bash
pnpm run build
pnpm start
```

**Individual services:**

```bash
# WebSocket server only
pnpm run start:ws

# LLM forwarder only
pnpm run start:llm

# Transcription module only
pnpm run dev:transcription
```

## 🌐 API Documentation

### Base URL

```
http://localhost:3000
```

### Health Check

```http
GET /health
```

Returns server status and active services.

### Authentication Routes (`/api/auth`)

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| POST   | `/register`        | User registration           |
| POST   | `/login`           | User authentication         |
| POST   | `/forgot-password` | Password reset request      |
| POST   | `/reset-password`  | Password reset confirmation |

### User Management (`/api/users`)

| Method | Endpoint   | Description         |
| ------ | ---------- | ------------------- |
| GET    | `/profile` | Get user profile    |
| PUT    | `/profile` | Update user profile |
| POST   | `/avatar`  | Upload user avatar  |

### Poll Management (`/api/polls`)

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | `/config`        | Get poll configuration |
| PUT    | `/config`        | Update poll settings   |
| POST   | `/questions`     | Add poll question      |
| GET    | `/questions`     | Get all questions      |
| DELETE | `/questions/:id` | Remove question        |

### Poll Configuration (`/api/poll`)

| Method | Endpoint    | Description             |
| ------ | ----------- | ----------------------- |
| GET    | `/`         | Get current poll config |
| POST   | `/settings` | Update host settings    |
| POST   | `/question` | Add new question        |

### Room Management (`/api/room-code`)

| Method | Endpoint    | Description        |
| ------ | ----------- | ------------------ |
| GET    | `/generate` | Generate room code |
| POST   | `/validate` | Validate room code |
| GET    | `/active`   | Get active rooms   |

### Results & Reports (`/api/results`)

| Method | Endpoint        | Description          |
| ------ | --------------- | -------------------- |
| GET    | `/poll/:pollId` | Get poll results     |
| POST   | `/submit`       | Submit poll response |
| GET    | `/reports`      | Get detailed reports |

### Transcription (`/transcripts`)

| Method | Endpoint  | Description             |
| ------ | --------- | ----------------------- |
| POST   | `/upload` | Upload transcript file  |
| GET    | `/`       | Get all transcripts     |
| GET    | `/:id`    | Get specific transcript |

### Settings & Configuration

| Method | Endpoint    | Description      |
| ------ | ----------- | ---------------- |
| GET    | `/settings` | Get app settings |
| PUT    | `/settings` | Update settings  |

## 🔌 Real-time Communication

### Socket.IO (Port 3000)

**Connection:** `http://localhost:3000/socket.io/`

**Events:**

**Client → Server:**

- `join-room` - Join a poll room
- `poll-response` - Submit poll answer
- `leave-room` - Leave poll room

**Server → Client:**

- `poll-started` - New poll initiated
- `poll-ended` - Poll completed
- `results-updated` - Live result updates
- `room-update` - Room status changes

### WebSocket (Port 3001)

**Connection:** `ws://localhost:3001/transcription`

**Audio Transcription Protocol:**

```javascript
// Start transcription session
{
  "type": "start",
  "guestId": "user123",
  "meetingId": "meeting456"
}

// Send audio data
Binary data (audio chunks)

// Receive transcription
{
  "type": "transcription",
  "text": "transcribed text",
  "timestamp": 1234567890,
  "guestId": "user123"
}
```

## 🗄️ Database Schema

### MongoDB Collections

**Users:**

```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  name: string,
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Poll Configuration:**

```typescript
{
  _id: ObjectId,
  hostSettings: {
    allowAnonymous: boolean,
    timeLimit: number,
    showResults: boolean
  },
  questions: Array<{
    text: string,
    type: 'multiple-choice' | 'true-false' | 'open-ended',
    options?: string[],
    correctAnswer?: string
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

**Results:**

```typescript
{
  _id: ObjectId,
  pollId: ObjectId,
  questionId: string,
  responses: Array<{
    userId?: ObjectId,
    guestId?: string,
    answer: string,
    timestamp: Date
  }>,
  summary: {
    totalResponses: number,
    breakdown: Record<string, number>
  }
}
```

**Room Codes:**

```typescript
{
  _id: ObjectId,
  code: string,
  pollId: ObjectId,
  isActive: boolean,
  expiresAt: Date,
  createdAt: Date
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm run dev                    # Start development server
pnpm run dev:transcription      # Transcription module only

# Building
pnpm run build                  # Compile TypeScript
pnpm run start                  # Start production server

# Services
pnpm run start:ws               # WebSocket server
pnpm run start:llm              # LLM forwarder service

# Testing & Quality
pnpm run test                   # Run tests
pnpm run test:client            # Test WebSocket client
pnpm run lint                   # ESLint
pnpm run format                 # Prettier formatting
```

### Code Quality

- **ESLint**: Configured with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Jest**: Unit testing framework

### Adding New Features

1. **Routes**: Add to `src/web/routes/`
2. **Controllers**: Add to `src/web/controllers/`
3. **Models**: Add to `src/web/models/`
4. **Services**: Add to `src/services/`
5. **Types**: Use shared types from `@poll-automation/types`

## 🔧 Configuration

### Environment Variables

| Variable            | Description                   | Default                             |
| ------------------- | ----------------------------- | ----------------------------------- |
| `BACKEND_HTTP_PORT` | HTTP server port              | `3000`                              |
| `MONGODB_URI`       | MongoDB connection string     | `mongodb://localhost:27017/pollgen` |
| `WHISPER_WS_URL`    | Whisper service WebSocket URL | `ws://localhost:8000`               |
| `LLM_FORWARD_URL`   | LLM service WebSocket URL     | `ws://localhost:5001/ws/llm`        |
| `JWT_SECRET`        | JWT signing secret            | Required for auth                   |
| `BCRYPT_ROUNDS`     | Password hashing rounds       | `12`                                |

### CORS Configuration

Configured to allow requests from:

- `http://localhost:5173` (Frontend development)
- `http://localhost:3000` (Backend port)

## 🧪 Testing

### Running Tests

```bash
pnpm test
```

### Test Clients

```bash
# WebSocket connection test
pnpm run test:client

# Test streaming client
ts-node test-client-streaming.ts
```

### Manual Testing

Use the provided HTML test files in `apps/frontend/public/`:

- `test-poll-room-management.html`
- `test-questions.html`
- `test-result-storage.html`

## 🚨 Error Handling

The backend implements comprehensive error handling:

- **Global Error Middleware**: Catches and formats errors
- **Validation Errors**: Input validation with descriptive messages
- **Database Errors**: MongoDB connection and query error handling
- **WebSocket Errors**: Connection and message parsing error handling
- **HTTP Status Codes**: Proper REST API status codes

## 📊 Monitoring & Logging

- **Console Logging**: Structured logging with emojis for visibility
- **MongoDB Change Streams**: Real-time database monitoring
- **WebSocket Connection Tracking**: Active connection monitoring
- **Health Endpoints**: Service status checking

## 🔒 Security

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Restricted origin access
- **Input Validation**: Request payload validation
- **Error Sanitization**: No sensitive data in error responses

## 🤝 Integration Points

### External Services

1. **Whisper Service** (`services/whisper`):
   - Audio transcription processing
   - WebSocket communication

2. **LLM Service** (`services/pollgen-llm`):
   - Poll generation from transcripts
   - AI-powered question creation

3. **Frontend** (`apps/frontend`):
   - React application
   - Real-time updates via Socket.IO

## 🔄 Data Flow

1. **Audio Input** → WebSocket → Whisper Service → Transcription
2. **Transcription** → LLM Service → Generated Questions
3. **Questions** → MongoDB → Frontend via Socket.IO
4. **Student Responses** → Socket.IO → MongoDB → Results

## 🏃‍♂️ Performance

- **Connection Pooling**: MongoDB connection optimization
- **WebSocket Buffering**: Efficient audio data handling
- **Change Streams**: Real-time data synchronization
- **Background Services**: Non-blocking poll monitoring

## 🤔 Troubleshooting

### Common Issues

**MongoDB Connection:**

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"
```

**WebSocket Issues:**

```bash
# Test WebSocket connection
wscat -c ws://localhost:3001/transcription
```

**Port Conflicts:**

```bash
# Check port usage
netstat -tlnp | grep :3000
```

**Environment Variables:**

```bash
# Verify environment
node -e "console.log(process.env.MONGODB_URI)"
```

## 📚 Documentation

- **[API Reference](./docs/API.md)** - Complete API documentation with examples

## 📋 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for:

- Development workflow
- Code standards
- Testing guidelines
- Pull request process

### Quick Start for Contributors

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run quality checks: `pnpm run lint && pnpm test`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

Internal use only. Contact project maintainers for details.
