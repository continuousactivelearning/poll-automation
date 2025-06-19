# 📁 Project Structure Guide for Team Development

## 🏗️ **Complete Project Structure**

```
poll-automation/
├── apps/
│   ├── frontend/                 # React Frontend (Port 5173)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── audio/        # 🎤 Audio Processing Components
│   │   │   │   │   ├── RealTimeTranscription.tsx
│   │   │   │   │   ├── AudioVisualizer.tsx
│   │   │   │   │   ├── NoiseReduction.tsx
│   │   │   │   │   └── AudioSettings.tsx
│   │   │   │   ├── polls/        # 📊 Poll Management Components
│   │   │   │   │   ├── PollCreator.tsx
│   │   │   │   │   ├── PollTemplates.tsx
│   │   │   │   │   ├── PollScheduler.tsx
│   │   │   │   │   └── PollAnalytics.tsx
│   │   │   │   ├── student/      # 🎓 Student Components (Enhanced)
│   │   │   │   │   ├── GameifiedPolls.tsx
│   │   │   │   │   ├── StudyGroups.tsx
│   │   │   │   │   ├── PersonalDashboard.tsx
│   │   │   │   │   └── Notifications.tsx
│   │   │   │   ├── host/         # 👨‍🏫 Host Components (Enhanced)
│   │   │   │   │   ├── AdvancedAnalytics.tsx
│   │   │   │   │   ├── ClassroomManagement.tsx
│   │   │   │   │   ├── ContentLibrary.tsx
│   │   │   │   │   └── ReportGenerator.tsx
│   │   │   │   └── navigation/   # 🧭 Navigation Components
│   │   │   ├── pages/            # 📄 Page Components
│   │   │   ├── contexts/         # ⚛️ React Contexts
│   │   │   ├── services/         # 🔌 API Services
│   │   │   ├── utils/            # 🛠️ Utility Functions
│   │   │   └── styles/           # 🎨 Styling
│   │   └── package.json
│   └── backend/                  # Node.js Backend (Port 3000)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts       # ✅ Authentication routes
│       │   │   ├── polls.ts      # ✅ Poll management routes
│       │   │   ├── meetings.ts   # ✅ Meeting routes
│       │   │   ├── audio.ts      # ✅ Audio processing routes
│       │   │   ├── analytics.ts  # 📊 NEW: Analytics routes
│       │   │   ├── notifications.ts # 🔔 NEW: Notification routes
│       │   │   └── reports.ts    # 📋 NEW: Report generation routes
│       │   ├── models/
│       │   │   ├── User.ts       # ✅ User model
│       │   │   ├── Poll.ts       # ✅ Poll model
│       │   │   ├── Meeting.ts    # ✅ Meeting model
│       │   │   ├── Response.ts   # ✅ Response model
│       │   │   ├── Analytics.ts  # 📊 NEW: Analytics model
│       │   │   └── Notification.ts # 🔔 NEW: Notification model
│       │   ├── services/
│       │   │   ├── emailService.ts    # ✅ Email service
│       │   │   ├── geminiService.ts   # ✅ AI service
│       │   │   ├── aiService.ts       # 🤖 NEW: Enhanced AI service
│       │   │   └── contentAnalysis.ts # 📝 NEW: Content analysis
│       │   └── middleware/
│       └── package.json
├── services/
│   ├── whisper/                  # 🎤 Speech-to-Text Service (Port 8000)
│   │   ├── main.py              # ✅ Whisper API
│   │   ├── requirements.txt     # ✅ Python dependencies
│   │   └── package.json
│   └── pollgen-llm/             # 🤖 AI Poll Generation Service
│       ├── main.py              # ✅ LLM API
│       ├── server.py            # ✅ FastAPI server
│       ├── vector.py            # ✅ Vector processing
│       └── package.json
├── shared/
│   ├── types/                   # 📝 Shared TypeScript Types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   └── utils/
│   │   └── package.json
│   └── utils/                   # 🛠️ Shared Utilities
├── tests/                       # 🧪 Testing (NEW)
│   ├── frontend/
│   │   ├── components/
│   │   └── integration/
│   ├── backend/
│   │   ├── routes/
│   │   └── services/
│   └── e2e/
├── docs/                        # 📚 Documentation (NEW)
│   ├── api/
│   ├── components/
│   └── deployment/
├── .github/
│   └── workflows/               # 🔄 CI/CD Pipelines (NEW)
│       ├── frontend.yml
│       ├── backend.yml
│       └── deploy.yml
├── docker-compose.yml           # ✅ Docker configuration
├── turbo.json                   # ✅ Turborepo configuration
├── package.json                 # ✅ Root package.json
├── pnpm-workspace.yaml          # ✅ pnpm workspace config
└── README.md                    # ✅ Project documentation
```

## 🎯 **Component Assignment by Folder**

### **Frontend Components to Build:**

#### **Audio Processing Team** (`apps/frontend/src/components/audio/`)
```typescript
// RealTimeTranscription.tsx
interface TranscriptionProps {
  isRecording: boolean;
  transcript: string;
  confidence: number;
}

// AudioVisualizer.tsx
interface VisualizerProps {
  audioData: Float32Array;
  isActive: boolean;
}

// NoiseReduction.tsx
interface NoiseReductionProps {
  enabled: boolean;
  level: number;
  onToggle: (enabled: boolean) => void;
}
```

#### **Poll Management Team** (`apps/frontend/src/components/polls/`)
```typescript
// PollCreator.tsx
interface PollCreatorProps {
  onSave: (poll: Poll) => void;
  templates: PollTemplate[];
}

// PollTemplates.tsx
interface TemplateProps {
  categories: string[];
  onSelect: (template: PollTemplate) => void;
}
```

#### **Student Engagement Team** (`apps/frontend/src/components/student/`)
```typescript
// GameifiedPolls.tsx
interface GameificationProps {
  points: number;
  badges: Badge[];
  streak: number;
}

// StudyGroups.tsx
interface StudyGroupProps {
  groups: StudyGroup[];
  currentUser: User;
}
```

### **Backend Routes to Build:**

#### **API Enhancement Team** (`apps/backend/src/routes/`)
```typescript
// analytics.ts
router.get('/analytics/polls/:pollId', getDetailedAnalytics);
router.get('/analytics/user/:userId', getUserAnalytics);
router.get('/analytics/meeting/:meetingId', getMeetingAnalytics);

// notifications.ts
router.post('/notifications/send', sendNotification);
router.get('/notifications/user/:userId', getUserNotifications);
router.put('/notifications/:id/read', markAsRead);

// reports.ts
router.post('/reports/generate', generateReport);
router.get('/reports/:id/download', downloadReport);
```

## 🔧 **Development Commands for Each Team**

### **Frontend Development:**
```bash
# Start frontend only
pnpm dev:frontend

# Test frontend
pnpm test:frontend

# Build frontend
pnpm build:frontend

# Lint frontend
pnpm lint:frontend
```

### **Backend Development:**
```bash
# Start backend only
pnpm dev:backend

# Test backend
pnpm test:backend

# Build backend
pnpm build:backend
```

### **Full Stack Development:**
```bash
# Start all services
pnpm dev

# Test everything
pnpm test

# Build everything
pnpm build
```

## 📋 **File Naming Conventions**

### **Components:**
- `PascalCase.tsx` for React components
- `camelCase.ts` for utilities
- `kebab-case.css` for styles

### **API Routes:**
- `camelCase.ts` for route files
- `camelCase` for function names
- `kebab-case` for URL endpoints

### **Tests:**
- `ComponentName.test.tsx` for component tests
- `routeName.test.ts` for API tests
- `featureName.e2e.test.ts` for E2E tests

## 🎯 **Integration Points**

### **Component Integration:**
1. **Audio components** → Connect to WebSocket service
2. **Poll components** → Connect to backend APIs
3. **Student components** → Connect to user context
4. **Host components** → Connect to meeting context

### **API Integration:**
1. **Frontend** → Backend APIs via `services/api.ts`
2. **Backend** → AI services via HTTP requests
3. **Real-time** → Socket.io connections
4. **Database** → MongoDB via Mongoose

This structure ensures each team member has clear ownership while maintaining integration points! 🚀
