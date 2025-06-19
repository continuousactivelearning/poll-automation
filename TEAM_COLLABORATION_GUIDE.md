# 🤝 Team Collaboration Guide - Working with Active PR

## 📋 Overview
This guide helps teammates contribute to the poll-automation project while the main PR (#37) is under review.

## 🎯 Current Project Status
- **Main PR**: #37 - Complete Frontend Enhancement & Monorepo Migration
- **PR Owner**: @gayathri-1911
- **Status**: Under review, conflicts resolved
- **Base Branch**: `development` → `main` (original repo)

## 🚀 Quick Start for Teammates

### Step 1: Fork and Clone the Repository

```bash
# Fork gayathri-1911/poll-automation on GitHub first, then:

# Clone YOUR fork (replace YOUR-USERNAME)
git clone https://github.com/YOUR-USERNAME/poll-automation.git
cd poll-automation

# Add upstream remotes
git remote add upstream https://github.com/continuousactivelearning/poll-automation.git
git remote add gayathri https://github.com/gayathri-1911/poll-automation.git

# Verify remotes
git remote -v
# Should show:
# origin    https://github.com/YOUR-USERNAME/poll-automation.git
# upstream  https://github.com/continuousactivelearning/poll-automation.git  
# gayathri  https://github.com/gayathri-1911/poll-automation.git
```

### Step 2: Get Latest Code

```bash
# Fetch all latest changes
git fetch --all

# Switch to gayathri's development branch (has all the latest work)
git checkout -b development gayathri/development

# Verify you're on the right branch with latest code
git log --oneline -5
# Should show recent commits from gayathri's work
```

### Step 3: Create Your Feature Branch

```bash
# Create your feature branch from gayathri's development
git checkout -b feature/your-feature-name

# Example feature names:
# git checkout -b feature/student-analytics
# git checkout -b feature/mobile-ui
# git checkout -b feature/advanced-testing
# git checkout -b feature/performance-optimization
```

### Step 4: Install Dependencies and Setup

```bash
# Install all dependencies
pnpm install

# Verify everything works
pnpm dev

# Should start:
# ✅ Frontend → http://localhost:5173
# ✅ Backend → http://localhost:3000  
# ✅ Whisper Service → http://localhost:8000
```

## 🎯 Recommended Work Areas (No Conflicts)

### 🎓 Student Dashboard Enhancements
**Assignee**: Teammate 1
**Files to work on**:
```
apps/frontend/src/
├── components/student/
│   ├── StudentAnalytics.tsx     # NEW
│   ├── StudentProgress.tsx      # NEW
│   ├── StudentLeaderboard.tsx   # NEW
│   └── StudentAchievements.tsx  # NEW
├── pages/StudentDashboard/
│   ├── AnalyticsTab.tsx         # NEW
│   ├── ProgressTab.tsx          # NEW
│   └── AchievementsTab.tsx      # NEW
└── services/
    └── studentApi.ts            # NEW
```

### 📊 Advanced Analytics System
**Assignee**: Teammate 2  
**Files to work on**:
```
apps/backend/src/
├── routes/
│   ├── analytics.ts             # NEW
│   └── reports.ts               # NEW
├── models/
│   ├── Analytics.ts             # NEW
│   └── Report.ts                # NEW
└── services/
    └── analyticsService.ts      # NEW

apps/frontend/src/
├── components/analytics/
│   ├── Charts.tsx               # NEW
│   ├── Reports.tsx              # NEW
│   └── Metrics.tsx              # NEW
└── pages/Analytics/
    └── AnalyticsDashboard.tsx   # NEW
```

### 📱 Mobile UI & Responsiveness
**Assignee**: Teammate 3
**Files to work on**:
```
apps/frontend/src/
├── styles/
│   ├── mobile.css               # NEW
│   ├── tablet.css               # NEW
│   └── responsive.css           # NEW
├── components/mobile/
│   ├── MobileNavigation.tsx     # NEW
│   ├── MobilePollInterface.tsx  # NEW
│   └── MobileHostControls.tsx   # NEW
└── hooks/
    ├── useDeviceDetection.ts    # NEW
    └── useResponsiveLayout.ts   # NEW
```

### 🧪 Testing & Quality Assurance
**Assignee**: Teammate 4
**Files to work on**:
```
apps/frontend/
├── src/__tests__/
│   ├── components/              # NEW
│   ├── pages/                   # NEW
│   └── services/                # NEW
├── cypress/
│   ├── e2e/                     # NEW
│   └── fixtures/                # NEW
└── jest.config.js               # NEW

apps/backend/
├── src/__tests__/
│   ├── routes/                  # NEW
│   ├── services/                # NEW
│   └── models/                  # NEW
└── jest.config.js               # NEW
```

## 💻 Development Workflow

### Daily Development Process

```bash
# 1. Start your day - sync with latest changes
git checkout development
git pull gayathri development

# 2. Switch to your feature branch
git checkout feature/your-feature-name

# 3. Merge latest changes into your branch
git merge development

# 4. Start development
pnpm dev

# 5. Make your changes
# ... work on your assigned files ...

# 6. Test your changes
pnpm test
pnpm lint

# 7. Commit your work
git add .
git commit -m "feat: add student analytics dashboard"

# 8. Push to your fork
git push origin feature/your-feature-name
```

### Creating Pull Requests

```bash
# After pushing your feature branch, create PR:
# 1. Go to GitHub
# 2. Navigate to YOUR fork
# 3. Click "New Pull Request"
# 4. Set up PR as follows:

# Base repository: gayathri-1911/poll-automation
# Base branch: development
# Head repository: YOUR-USERNAME/poll-automation  
# Compare branch: feature/your-feature-name

# 5. Add description:
```

**PR Template**:
```markdown
## 🎯 Feature: [Your Feature Name]

### 📝 Description
Brief description of what this adds to the project.

### 🔧 Changes Made
- [ ] Added new components
- [ ] Created new API endpoints  
- [ ] Added tests
- [ ] Updated documentation

### 🧪 Testing
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] No conflicts with main development branch

### 📸 Screenshots (if UI changes)
[Add screenshots here]

### 🔗 Dependencies
- Depends on: #37 (gayathri's main PR)
- Blocks: [any issues this blocks]

### ✅ Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
```

## 🚦 Coordination & Communication

### Before Starting Work
1. **Comment on GitHub Issue**: "Starting work on [feature]"
2. **Team Chat**: "@team Working on apps/frontend/src/components/student/ today"
3. **Check File Conflicts**: Ensure no one else is working on same files

### During Development
1. **Daily Updates**: Share progress in team chat
2. **File Changes**: Announce when modifying shared files
3. **Blockers**: Report any dependencies on gayathri's PR

### Before Creating PR
1. **Test Integration**: Ensure your feature works with existing code
2. **Conflict Check**: Verify no conflicts with development branch
3. **Team Review**: Get informal review from teammates

## 🔧 Technical Guidelines

### Environment Setup
```bash
# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Add your API keys (if needed)
# Edit apps/backend/.env:
# GEMINI_API_KEY=your-key-here
```

### Code Style
```bash
# Before committing, always run:
pnpm lint
pnpm format
pnpm type-check

# Fix any issues before pushing
```

### Testing Requirements
```bash
# Add tests for new features
# Run tests before pushing
pnpm test

# For new components, add:
# - Unit tests
# - Integration tests  
# - E2E tests (if applicable)
```

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Cannot find module" errors
```bash
# Solution: Reinstall dependencies
rm -rf node_modules
pnpm install
```

**Issue**: Port conflicts
```bash
# Solution: Kill existing processes
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill -9
```

**Issue**: Merge conflicts with development
```bash
# Solution: Resolve conflicts
git checkout development
git pull gayathri development
git checkout feature/your-feature-name
git merge development
# Resolve conflicts in editor
git add .
git commit -m "resolve: merge conflicts with development"
```

### Getting Help
1. **GitHub Issues**: Create issue with `help wanted` label
2. **Team Chat**: Ask in development channel
3. **Code Review**: Request review from @gayathri-1911
4. **Documentation**: Check existing docs in `/docs` folder

## 📅 Timeline & Milestones

### Phase 1: Foundation (Current)
- ✅ Gayathri's main PR under review
- 🔄 Teammates start on independent features

### Phase 2: Integration (After main PR merge)
- 🎯 Merge teammate PRs into development
- 🧪 Integration testing
- 🐛 Bug fixes and refinements

### Phase 3: Production (Final)
- 🚀 Merge development to main
- 📦 Production deployment
- 📊 Performance monitoring

## 🎉 Success Metrics

### Individual Contributions
- [ ] Feature completed without conflicts
- [ ] Tests pass and coverage maintained
- [ ] Code review approved
- [ ] Documentation updated

### Team Success
- [ ] All features integrate smoothly
- [ ] No major conflicts during merge
- [ ] Project timeline maintained
- [ ] Quality standards met

---

## 🚀 Ready to Start?

1. **Choose your feature** from the recommended work areas
2. **Follow the setup process** above
3. **Create your feature branch**
4. **Start coding** and have fun! 🎉

**Remember**: Communication is key! Keep the team updated on your progress.

---

## 📚 Additional Resources

### Project Architecture
```
poll-automation/
├── apps/
│   ├── frontend/         # React + TypeScript + Vite
│   └── backend/          # Express + TypeScript + Socket.io
├── services/
│   ├── whisper/          # Python FastAPI (Audio transcription)
│   ├── pollgen-llm/      # AI poll generation service
│   └── pollgen-gemini/   # Gemini AI integration
├── shared/
│   └── types/            # Shared TypeScript types
└── docs/                 # Project documentation
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Socket.io, MongoDB
- **AI Services**: OpenAI Whisper, Google Gemini
- **Build System**: Turborepo, pnpm workspaces
- **Testing**: Jest, Cypress, React Testing Library

### API Endpoints (Available)
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/audio/upload      # Audio file upload
GET  /api/audio/transcribe  # Get transcription
POST /api/polls/generate    # Generate polls from audio
GET  /api/polls/:id         # Get specific poll
POST /api/host-settings     # Host configuration
```

### WebSocket Events (Available)
```javascript
// Client to Server
socket.emit('join-meeting', meetingId);
socket.emit('launch-poll', { meetingId, poll });
socket.emit('submit-answer', { meetingId, userId, pollId, answer });
socket.emit('audio-chunk', { meetingId, audioChunk, chunkIndex });

// Server to Client
socket.on('new-poll', poll);
socket.on('poll-response', { userId, pollId, answer });
socket.on('realtime-transcript-update', { transcript, timestamp });
socket.on('realtime-poll-generated', { poll, timestamp });
```

### Environment Variables Reference
```bash
# apps/backend/.env
PORT=3000
MONGO_URI=mongodb://localhost:27017/poll-automation
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173

# apps/frontend/.env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Useful Commands
```bash
# Development
pnpm dev                    # Start all services
pnpm dev:frontend          # Frontend only
pnpm dev:backend           # Backend only
pnpm dev:whisper           # Whisper service only

# Building
pnpm build                 # Build all packages
pnpm build:frontend        # Build frontend only
pnpm build:backend         # Build backend only

# Testing
pnpm test                  # Run all tests
pnpm test:frontend         # Frontend tests only
pnpm test:backend          # Backend tests only
pnpm test:e2e              # End-to-end tests

# Linting & Formatting
pnpm lint                  # Lint all packages
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code
pnpm type-check            # TypeScript type checking
```

## 🔗 Quick Links

- **Main Repository**: https://github.com/continuousactivelearning/poll-automation
- **Gayathri's Fork**: https://github.com/gayathri-1911/poll-automation
- **Active PR**: https://github.com/continuousactivelearning/poll-automation/pull/37
- **Project Board**: [Create GitHub Project Board for task tracking]
- **Team Chat**: [Add your team communication channel]

## 📞 Contact Information

- **Project Lead**: @gayathri-1911
- **Email**: chaitanyabaggam3@gmail.com
- **GitHub**: https://github.com/gayathri-1911

---

*Happy coding! 🚀*
