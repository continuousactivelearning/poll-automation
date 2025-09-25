# API Reference

Complete API documentation for the Poll Automation Backend.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2025-01-12T10:30:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2025-01-12T10:30:00.000Z"
}
```

## Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

### User Management

#### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile

```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### Upload Avatar

```http
POST /api/users/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

### Poll Configuration

#### Get Poll Configuration

```http
GET /api/poll/
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "hostSettings": {
      "allowAnonymous": true,
      "timeLimit": 60,
      "showResults": true,
      "allowMultipleAttempts": false
    },
    "questions": [
      {
        "id": "q1",
        "text": "What is the capital of France?",
        "type": "multiple-choice",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "correctAnswer": "Paris"
      }
    ]
  }
}
```

#### Update Host Settings

```http
POST /api/poll/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "allowAnonymous": true,
  "timeLimit": 90,
  "showResults": false,
  "allowMultipleAttempts": true
}
```

#### Add Poll Question

```http
POST /api/poll/question
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "What is 2 + 2?",
  "type": "multiple-choice",
  "options": ["3", "4", "5", "6"],
  "correctAnswer": "4"
}
```

### Poll Management

#### Get Poll Questions

```http
GET /api/polls/questions
Authorization: Bearer <token>
```

#### Update Poll Configuration

```http
PUT /api/polls/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "hostSettings": {
    "allowAnonymous": true,
    "timeLimit": 120
  }
}
```

#### Add Question to Poll

```http
POST /api/polls/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "True or False: The Earth is flat",
  "type": "true-false",
  "correctAnswer": "false"
}
```

#### Delete Question

```http
DELETE /api/polls/questions/:questionId
Authorization: Bearer <token>
```

### Room Management

#### Generate Room Code

```http
GET /api/room-code/generate
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "code": "ABC123",
    "pollId": "poll_id_here",
    "expiresAt": "2025-01-12T12:00:00.000Z"
  }
}
```

#### Validate Room Code

```http
POST /api/room-code/validate
Content-Type: application/json

{
  "code": "ABC123"
}
```

#### Get Active Rooms

```http
GET /api/room-code/active
Authorization: Bearer <token>
```

### Results & Responses

#### Submit Poll Response

```http
POST /api/results/submit
Content-Type: application/json

{
  "roomCode": "ABC123",
  "questionId": "q1",
  "answer": "Paris",
  "guestId": "guest_123"
}
```

#### Get Poll Results

```http
GET /api/results/poll/:pollId
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pollId": "poll_id",
    "totalResponses": 25,
    "questions": [
      {
        "questionId": "q1",
        "text": "What is the capital of France?",
        "responses": 25,
        "breakdown": {
          "London": 2,
          "Berlin": 1,
          "Paris": 20,
          "Madrid": 2
        },
        "correctAnswer": "Paris",
        "accuracy": 80
      }
    ],
    "summary": {
      "averageAccuracy": 78.5,
      "completionRate": 96.2
    }
  }
}
```

#### Get Detailed Reports

```http
GET /api/results/reports
Authorization: Bearer <token>
Query Parameters:
- pollId: Filter by poll ID
- startDate: Filter by start date (ISO 8601)
- endDate: Filter by end date (ISO 8601)
- format: Response format (json, csv)
```

### Transcription Management

#### Upload Transcript

```http
POST /transcripts/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

transcript: <file>
meetingId: "meeting_123"
```

#### Get All Transcripts

```http
GET /transcripts/
Authorization: Bearer <token>
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- meetingId: Filter by meeting ID
```

#### Get Specific Transcript

```http
GET /transcripts/:transcriptId
Authorization: Bearer <token>
```

### Settings

#### Get Application Settings

```http
GET /settings/
Authorization: Bearer <token>
```

#### Update Settings

```http
PUT /settings/
Authorization: Bearer <token>
Content-Type: application/json

{
  "maxQuestionsPerPoll": 20,
  "defaultTimeLimit": 60,
  "enableAnonymousMode": true,
  "autoGenerateFromTranscripts": false
}
```

### System

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-01-12T10:30:00.000Z",
  "services": {
    "http": "active",
    "socketIO": "active (poll management)",
    "webSocket": "active (transcription)",
    "database": "connected",
    "whisper": "connected",
    "llm": "connected"
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

## Error Codes

| Code                  | HTTP Status | Description                  |
| --------------------- | ----------- | ---------------------------- |
| `VALIDATION_ERROR`    | 400         | Invalid request data         |
| `UNAUTHORIZED`        | 401         | Authentication required      |
| `FORBIDDEN`           | 403         | Insufficient permissions     |
| `NOT_FOUND`           | 404         | Resource not found           |
| `CONFLICT`            | 409         | Resource already exists      |
| `RATE_LIMIT`          | 429         | Too many requests            |
| `SERVER_ERROR`        | 500         | Internal server error        |
| `SERVICE_UNAVAILABLE` | 503         | External service unavailable |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General API**: 100 requests per minute
- **File uploads**: 10 requests per minute
- **WebSocket connections**: 5 connections per minute

## Pagination

List endpoints support pagination:

```http
GET /api/endpoint?page=1&limit=10&sort=createdAt&order=desc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## WebSocket Events

### Socket.IO Events (Port 3000)

**Client to Server:**

- `join-room(roomCode)` - Join a poll room
- `leave-room(roomCode)` - Leave a poll room
- `poll-response(data)` - Submit poll answer
- `request-results(pollId)` - Request current results

**Server to Client:**

- `room-joined(roomData)` - Confirmed room join
- `poll-started(pollData)` - New poll initiated
- `poll-ended(results)` - Poll completed with results
- `question-added(question)` - New question added
- `results-updated(results)` - Live result updates
- `error(error)` - Error notification

### WebSocket Protocol (Port 3001)

**Connection:** `ws://localhost:3001/transcription`

**Message Types:**

1. **Start Session:**

```json
{
  "type": "start",
  "guestId": "user_123",
  "meetingId": "meeting_456"
}
```

2. **Audio Data:** Binary frames containing audio chunks

3. **Transcription Result:**

```json
{
  "type": "transcription",
  "text": "This is the transcribed text",
  "timestamp": 1641123456789,
  "guestId": "user_123",
  "confidence": 0.95,
  "isFinal": true
}
```

4. **Error:**

```json
{
  "type": "error",
  "code": "TRANSCRIPTION_FAILED",
  "message": "Failed to process audio"
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get poll configuration
const response = await api.get('/api/poll/');
console.log(response.data);
```

### Socket.IO Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.emit('join-room', 'ABC123');

socket.on('poll-started', (data) => {
  console.log('New poll started:', data);
});

socket.on('results-updated', (results) => {
  console.log('Updated results:', results);
});
```

### WebSocket Client

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/transcription');

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'start',
      guestId: 'user_123',
      meetingId: 'meeting_456',
    })
  );
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'transcription') {
    console.log('Transcription:', message.text);
  }
});
```
