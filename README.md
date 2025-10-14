# PollGen - AI-Powered Interactive Polling System

PollGen is a sophisticated, real-time polling application that combines AI-powered question generation with live audio transcription to create intelligent, interactive learning experiences. The system enables hosts to conduct dynamic sessions with real-time poll generation and provides students with engaging, gamified participation through live leaderboards and achievement tracking.

## 🌐 Live Demo

🚀 **[Try PollGen Live](https://automatic-poll-generation-plum.vercel.app/)**

Experience the full functionality of PollGen with our live deployment. Create polls, join sessions, and explore the AI-powered question generation in real-time!

## 🚀 Key Features

### 🎯 AI-Powered Question Generation
- **Real-time ASR (Automatic Speech Recognition)**: Live audio transcription during sessions
- **Intelligent Poll Creation**: AI generates contextual questions from live speech
- **Multiple Question Types**: True/False, Multiple Choice with customizable options
- **Manual Poll Creation**: Traditional poll creation with full customization

### 🔄 Real-time WebSocket Communication
- **Live Session Management**: Instant synchronization between hosts and students
- **Real-time Voting**: Immediate vote submission and result tracking
- **Dynamic Participant Management**: Live participant count and status updates
- **Session Broadcasting**: Real-time poll launches and session events

### 👥 Multi-Role Experience
- **Host Dashboard**: Comprehensive session control with analytics
- **Student Interface**: Interactive participation with real-time feedback
- **Session Reports**: Detailed analytics and leaderboard generation
- **Achievement System**: Gamified learning with points and streaks

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ • Host UI       │    │ • WebSocket     │    │ • ASR Engine    │
│ • Student UI    │    │ • REST API      │    │ • Gemini API    │
│ • Real-time     │    │ • Auth System   │    │ • Question Gen  │
│   Updates       │    │ • Database      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🎙️ ASR (Automatic Speech Recognition) System

The ASR system is the heart of PollGen's intelligent question generation:

#### How ASR Works
1. **Audio Capture**: Host's microphone input is captured in real-time
2. **Stream Processing**: Audio is processed in chunks for continuous transcription
3. **Speech-to-Text**: Advanced speech recognition converts audio to text
4. **Context Analysis**: Transcribed text is analyzed for educational content
5. **Question Generation**: AI generates relevant poll questions from speech context

#### ASR Features
- **Real-time Processing**: Live transcription with minimal latency
- **Context Awareness**: Understanding of educational content and topics
- **Multi-language Support**: Supports various languages and accents
- **Noise Filtering**: Advanced audio processing for clear transcription
- **Continuous Learning**: Improves accuracy over time

### 🌐 WebSocket Communication

Real-time communication is powered by Socket.IO with these core functions:

#### Host WebSocket Events
```javascript
// Session Management
socket.emit('create-room', roomData)           // Create new session
socket.emit('host-end-session', roomId)        // End current session
socket.emit('launch-poll', pollData)           // Launch poll to students

// Real-time Updates
socket.on('participant-joined', callback)      // New student joins
socket.on('vote-submitted', callback)          // Student submits vote
socket.on('session-report-ready', callback)   // Final session report
```

#### Student WebSocket Events
```javascript
// Session Participation
socket.emit('student-join-room', roomCode)     // Join session with code
socket.emit('student-submit-vote', voteData)   // Submit poll answer

// Real-time Updates
socket.on('poll-started', callback)            // New poll available
socket.on('poll-ended', callback)              // Poll voting ended
socket.on('session-ended', callback)          // Session terminated
socket.on('leaderboard-updated', callback)    // Live leaderboard changes
```

#### Core WebSocket Functions
- **Room Management**: Create, join, and manage session rooms
- **Real-time Synchronization**: Instant updates across all participants
- **Event Broadcasting**: Efficient message distribution to room participants
- **Connection Management**: Handle disconnections and reconnections
- **Authentication**: Secure WebSocket connections with JWT tokens

## 🎓 Host and Student Interaction Flow

### 📋 Host Experience

1. **Session Creation**
   - Create named session with unique room code
   - Configure session settings and permissions
   - Generate shareable invite links

2. **Live Session Management**
   - Start real-time audio transcription
   - Monitor AI-generated question suggestions
   - Launch polls instantly to all students
   - View real-time participation metrics

3. **Session Control**
   - Manual poll creation and customization
   - Real-time participant monitoring
   - Session timing and pace control
   - End session with automatic report generation

### 👨‍🎓 Student Experience

1. **Session Joining**
   - Enter room code or use invite link
   - Automatic authentication and room assignment
   - Real-time connection status feedback

2. **Active Participation**
   - Receive polls instantly when launched
   - Submit answers with immediate feedback
   - View personal score and ranking
   - Track progress with achievements

3. **Gamified Learning**
   - Real-time leaderboard positioning
   - Points awarded for correct answers
   - Streak bonuses for consecutive correct answers
   - Time-based scoring for quick responses

### 🔄 Real-time Interaction Cycle

```
Host Speaks → ASR Transcription → AI Analysis → Question Generation
     ↓
Poll Launch → WebSocket Broadcast → Student Notifications
     ↓
Student Voting → Real-time Results → Leaderboard Updates
     ↓
Session Analytics → Report Generation → Final Results
```

## 📁 Project Structure


```
Poll-Automation/
├── apps/
│   ├── backend/                    # Node.js Express Server
│   │   ├── src/
│   │   │   ├── websocket/          # WebSocket event handlers
│   │   │   ├── web/                # REST API controllers
│   │   │   ├── transcription/      # ASR integration
│   │   │   └── index.ts            # Server entry point
│   │   └── package.json
│   └── frontend/                   # React TypeScript App
│       ├── src/
│       │   ├── components/         # Reusable UI components
│       │   ├── pages/              # Host and Student dashboards
│       │   ├── contexts/           # WebSocket and Auth contexts
│       │   └── utils/              # API services and helpers
│       └── package.json
shared
│   ├── types/                      # TypeScript type definitions
│   └── utils/                      # Shared utilities
└── package.json                    
```


## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **MongoDB** (Local or Atlas)
- **pnpm** (Package manager)

### 🔧 Installation & Setup

#### 1. Clone the Repository

```bash
git clone --branch prod https://github.com/continuousactivelearning/poll-automation.git
cd poll-automation
```

#### 2. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install backend dependencies
cd apps/backend
pnpm install

# Install frontend dependencies
cd apps/frontend
pnpm install
```

#### 3. Environment Configuration

Create `.env` files in the respective directories:

**`apps/backend/.env`**
```env
# Server configuration
PORT=8000
HOST=localhost
CORS_ORIGIN=http://localhost:5174
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-refresh-access-token-secret
REFRESH_TOKEN_EXPIRY=7d
JWT_SECRET=your-jwt-secret-key

# Database configuration
DB_NAME=poll-automation
MONGODB_URI="mongodb://localhost:27017"

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Email configuration
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
SENDER_EMAIL=noreply@pollgen.com

# JWT configuration
JWT_SECRET=your-jwt-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:5174

# Gemini API configuration
GEMINI_API_KEY=your-google-api-key

```

**`apps/frontend/.env`**
```env
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5174

# Gemini API Key for AI Question Generation
VITE_GEMINI_API_KEY=your-google-api-key
```

#### 4. Database Setup

Ensure MongoDB is running locally or configure MongoDB Atlas connection in your environment variables.

### ▶️ Running the Application

#### Development Mode

From the root directory:

```bash
# Start all services in development mode
cd apps/backend
npm run dev

cd apps/frontend
pnpm run dev
```

This will start:
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:8000

#### Individual Services

```bash
# Start only backend
cd apps/backend 
npm run dev

# Start only frontend
cd apps/frontend
pnpm run dev

```

### 🔐 API Key Setup

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Generate an API key
3. Add to `.env` as `GEMINI_API_KEY`

#### Cloudinary (Optional - for file uploads)
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and secret
3. Add to `apps/backend/.env`

### 🎯 Usage

#### For Hosts
1. Navigate to http://localhost:5174
2. Register/Login as Host
3. Create a new session
4. Share the room code with students
5. Start speaking to generate AI questions or create manual polls
6. Launch polls and monitor real-time results

#### For Students
1. Navigate to http://localhost:5174
2. Register/Login as Student
3. Enter the room code provided by host
4. Participate in polls and track your progress
5. View leaderboard and achievements

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:backend      # Start backend only
pnpm dev:frontend     # Start frontend only

# Building
pnpm build            # Build all applications
pnpm build:backend    # Build backend only
pnpm build:frontend   # Build frontend only

# Utilities
pnpm lint             # Lint all code
pnpm test             # Run tests
pnpm clean            # Clean build artifacts
```

## 📊 Main Project Functions

### What This Project Does

**PollGen** transforms traditional static presentations into dynamic, interactive learning experiences by:

1. **Real-time Speech Analysis**: Continuously listens to the host's speech and converts it to text using advanced ASR technology

2. **Intelligent Question Generation**: Uses AI to analyze speech content and automatically generate relevant poll questions based on the discussed topics

3. **Live Interactive Polling**: Enables instant poll creation and distribution to all connected students with real-time voting capabilities

4. **Gamified Learning**: Implements a comprehensive scoring system with points, streaks, and leaderboards to motivate student participation

5. **Session Management**: Provides complete control over learning sessions with participant tracking, analytics, and detailed reporting

6. **Cross-Platform Communication**: Seamlessly connects hosts and students through WebSocket technology for instant updates and interactions

### Core Workflows

#### AI Question Generation Workflow
```
Host Speech → ASR Processing → Text Analysis → Context Understanding → Question Creation → Poll Launch
```

#### Student Participation Workflow  
```
Join Session → Receive Polls → Submit Answers → Get Feedback → Update Rankings → View Progress
```

#### Session Analytics Workflow
```
Vote Collection → Score Calculation → Streak Tracking → Report Generation → Performance Analysis
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini API for AI-powered question generation
- Socket.IO for real-time communication
- React and Node.js communities for excellent documentation
- MongoDB for robust data storage
- All contributors and testers who helped improve this project

---
