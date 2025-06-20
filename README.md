# 🎤 Poll Automation - Smart Poll Generation Platform

An AI-powered educational platform that generates intelligent poll questions from voice recordings using OpenAI's Whisper and GPT-3.5-turbo.

![Poll Automation](https://img.shields.io/badge/AI-Powered-blue) ![React](https://img.shields.io/badge/React-18.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18.0-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🌟 Key Features Overview

### 🤖 **AI-Powered Intelligence**
- **Voice-to-Poll Generation** → Record audio, get instant poll questions
- **Smart Transcription** → OpenAI Whisper converts speech to text
- **Intelligent Question Creation** → GPT-3.5-turbo generates relevant polls
- **Automatic Difficulty Assessment** → AI categorizes question complexity
- **Content Analysis** → Extracts key topics and concepts

### 🎨 **Beautiful User Interface**
- **Glassmorphism Design** → Modern frosted glass effects
- **Smooth Animations** → Professional slide and fade transitions
- **Gradient Typography** → Eye-catching text with color transitions
- **Responsive Layout** → Perfect on desktop, tablet, and mobile
- **Dark/Light Themes** → Adaptive design for any preference

### 📊 **Real-Time Engagement**
- **Live Poll Delivery** → Instant question distribution
- **Real-Time Responses** → See answers as they come in
- **Dynamic Leaderboards** → Live ranking updates
- **Instant Feedback** → Immediate correct/incorrect indicators
- **Engagement Analytics** → Track participation and performance

### 🎓 **Educational Features**
- **Progress Tracking** → Individual learning analytics
- **Achievement System** → Badges and rewards for milestones
- **Study Materials** → Integrated learning resources
- **Performance Insights** → Detailed accuracy and speed metrics
- **Gamification** → Points, streaks, and competitive elements

## ✨ Detailed Features

### 🎯 **Host Dashboard**
- **🎤 AI Audio Recording** - Record voice and generate polls automatically
- **📊 Poll Control** - Create and manage interactive polls
- **👥 Participants Management** - Track participant engagement
- **📈 Real-time Analytics** - Live performance insights
- **🏆 Leaderboard** - Gamified participant rankings

### 🎓 **Student Dashboard**
- **📊 Active Polls** - Join and answer live polls
- **📈 Progress Tracking** - Personal learning analytics
- **🏆 Achievements** - Badge and reward system
- **📚 Study Materials** - Interactive learning resources
- **🥇 Leaderboard** - Competitive rankings

### 🤖 **AI Integration**
- **Speech-to-Text** - OpenAI Whisper transcription
- **Smart Poll Generation** - GPT-3.5-turbo question creation
- **Content Analysis** - Intelligent topic extraction
- **Difficulty Assessment** - Automatic question categorization

## 🚀 How to Run the Application

### 📋 Prerequisites
Before running the application, ensure you have:
- **Node.js 18.0+** installed ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Git** for cloning the repository

### 🎯 Quick Start (Recommended)

#### **Step 1: Clone the Repository**
```bash
git clone https://github.com/gayathri-1911/poll-automation.git
cd poll-automation
```

#### **Step 2: Setup Environment**
```bash
# Copy the environment template
cp packages/server/.env.example packages/server/.env

# Edit the .env file and add your OpenAI API key
# Open packages/server/.env in your text editor and replace:
# OPENAI_API_KEY=your-openai-api-key-here
```

#### **Step 3: Run the Application**

**🪟 On Windows:**
```powershell
# Run the automated setup script
.\scripts\dev.ps1
```

**🐧 On Linux/macOS:**
```bash
# Make script executable and run
chmod +x scripts/dev.sh
./scripts/dev.sh
```

**🔧 Manual Setup (Alternative):**
```bash
# 1. Install all dependencies
npm install

# 2. Build shared package
npm run build --workspace=packages/shared

# 3. Start both servers
npm run dev
```

#### **Step 4: Access Your Application**
- **🌐 Frontend:** http://localhost:3000
- **⚙️ Backend API:** http://localhost:5000
- **📚 API Docs:** http://localhost:5000/api/docs

---

### 🐳 Docker Setup (Production-like)

#### **Step 1: Clone and Setup**
```bash
git clone https://github.com/gayathri-1911/pollgeneration.git
cd pollgeneration

# Setup environment
cp packages/server/.env.example packages/server/.env
# Edit packages/server/.env and add your OpenAI API key
```

#### **Step 2: Run with Docker**
```bash
# Start all services (MongoDB, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### **Step 3: Access Services**
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **MongoDB:** localhost:27017
- **Redis:** localhost:6379

---

### 🛠️ Development Commands

#### **Root Level Commands:**
```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Clean all build artifacts
npm run clean
```

#### **Individual Package Commands:**
```bash
# Frontend only
npm run dev:client
npm run build:client

# Backend only
npm run dev:server
npm run build:server

# Shared package only
npm run build --workspace=packages/shared
```

---

### 🔧 Troubleshooting

#### **Common Issues:**

**❌ Port already in use:**
```bash
# Kill processes on ports 3000 and 5000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS:
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**❌ OpenAI API errors:**
- Verify your API key in `packages/server/.env`
- Check your OpenAI account has credits
- Ensure the API key has proper permissions

**❌ Dependencies issues:**
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
npm install
```

**❌ Build errors:**
```bash
# Rebuild shared package
npm run build --workspace=packages/shared
npm run dev
```

## 🎨 UI Features

### Modern Design
- **Glassmorphism Effects** - Beautiful backdrop blur and transparency
- **Gradient Typography** - Eye-catching text with color transitions
- **Smooth Animations** - Professional slide and fade effects
- **Responsive Layout** - Works on all screen sizes

### Enhanced Navigation
- **Side Navigation** - Role-based navigation panels
- **Tab Navigation** - Modern pill-style tabs
- **Enhanced Navbar** - Professional header with user management

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **TypeScript** - Type-safe backend
- **Socket.io** - Real-time communication
- **Multer** - File upload handling

### AI Services
- **OpenAI Whisper** - Speech-to-text transcription
- **GPT-3.5-turbo** - Intelligent poll generation
- **Real-time Processing** - Live audio analysis

## 📁 Monorepo Folder Structure (Turborepo)
```
poll-automation/
├── apps/
│   ├── frontend/         # Vite React TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── pages/         # Main page components
│   │   │   ├── contexts/      # React contexts
│   │   │   └── styles/        # CSS and animations
│   │   ├── Dockerfile     # Client container config
│   │   └── nginx.conf     # Nginx configuration
│   └── backend/          # Express TypeScript backend
│       ├── src/
│       │   ├── routes/        # API routes
│       │   ├── models/        # Data models
│       │   └── index.ts       # Server entry point
│       └── Dockerfile     # Server container config
├── services/
│   ├── whisper/          # Python service for audio transcription (Whisper)
│   └── pollgen-llm/      # Poll generation logic using API/Local LLMs
├── shared/
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utility functions
├── .github/
│   └── workflows/        # CI/CD pipelines
├── scripts/               # Development scripts
├── docker-compose.yml     # Multi-container setup
├── turbo.json            # Turborepo configuration
├── package.json          # Root workspace configuration
└── README.md
```

## 🎯 How to Use the Application

### 🎤 For Meeting Hosts

#### **Getting Started:**
1. **Open the app** at http://localhost:3000
2. **Sign up** by selecting "Meeting Host" role
3. **Create an account** with your email and password

#### **Creating and Managing Meetings:**
1. **Navigate to "Live Meeting"** from the dashboard
2. **Click "Connect to Meeting"** to create a new session
3. **Share the meeting code** with participants
4. **Start your presentation** or lecture

#### **AI-Powered Poll Generation:**
1. **Click "AI Audio Recording"** button
2. **Record your voice** explaining a topic (up to 5 minutes)
3. **Wait for AI processing** (Whisper transcribes, GPT generates polls)
4. **Review generated polls** and select which ones to use
5. **Launch polls** to participants in real-time

#### **Monitoring and Analytics:**
- **View participant responses** as they come in
- **See real-time statistics** and accuracy rates
- **Monitor engagement** through the participants panel
- **Track leaderboards** and performance metrics

### 🎓 For Students/Participants

#### **Joining a Meeting:**
1. **Open the app** at http://localhost:3000
2. **Sign up** by selecting "Participant" role
3. **Enter the meeting code** provided by your host
4. **Join the active session**

#### **Participating in Polls:**
1. **Wait for polls** to appear on your screen
2. **Read questions carefully** and select your answer
3. **Submit responses** within the time limit
4. **See immediate feedback** on correct/incorrect answers

#### **Tracking Your Progress:**
- **View your accuracy** and response times
- **Earn badges** for achievements
- **Climb the leaderboard** by answering correctly
- **Track your learning** in the Progress section

### 🔄 Real-time Features

#### **Live Updates:**
- **Instant poll delivery** to all participants
- **Real-time response collection** and display
- **Live leaderboard updates** as scores change
- **Immediate feedback** on answer correctness

#### **Engagement Tools:**
- **Time-limited polls** for urgency
- **Multiple choice questions** with varying difficulty
- **Streak tracking** for consecutive correct answers
- **Point system** with speed bonuses

## ⚙️ Configuration

### 🔐 Environment Variables

Create `packages/server/.env` file with these variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/poll-generation

# OpenAI Configuration (Required)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key

# Optional: File upload limits
MAX_FILE_SIZE=25MB
UPLOAD_PATH=./uploads
```

### 🎛️ Application Settings

#### **Audio Processing:**
- **Max file size:** 25MB
- **Supported formats:** WAV, MP3, M4A, WebM
- **Max duration:** 5 minutes
- **Processing timeout:** 30 seconds

#### **Poll Configuration:**
- **Max options per poll:** 6
- **Default time limit:** 30 seconds
- **Max participants per meeting:** 100
- **Meeting duration limit:** 4 hours

#### **AI Settings:**
- **Transcription model:** OpenAI Whisper
- **Poll generation model:** GPT-3.5-turbo
- **Max tokens per request:** 1000
- **Temperature:** 0.7 (for creative poll generation)

### 🔧 Customization

#### **Modify AI Behavior:**
Edit `packages/server/src/routes/audio.ts` to adjust:
- Poll generation prompts
- Difficulty assessment criteria
- Number of polls generated per audio
- Question types and formats

#### **UI Customization:**
Edit `packages/client/src/styles/` to modify:
- Color schemes and gradients
- Animation timings and effects
- Typography and spacing
- Component styling

#### **Database Schema:**
Modify `packages/server/src/models/` to change:
- User data structure
- Meeting and poll schemas
- Response tracking format

## 📚 Additional Resources

### 🎥 **Demo and Tutorials**
- **Live Demo:** [Coming Soon]
- **Video Tutorial:** [Coming Soon]
- **API Documentation:** http://localhost:5000/api/docs (when running)

### 🔗 **Useful Links**
- **OpenAI API Documentation:** https://platform.openai.com/docs
- **React Documentation:** https://react.dev/
- **Tailwind CSS Guide:** https://tailwindcss.com/docs
- **Socket.io Documentation:** https://socket.io/docs/

### 💡 **Tips for Best Experience**
- **Use a good microphone** for better audio transcription
- **Speak clearly and at moderate pace** for optimal AI processing
- **Keep audio recordings under 3 minutes** for faster processing
- **Test with small groups first** before large meetings
- **Ensure stable internet connection** for real-time features

### 🐛 **Getting Help**
- **Issues:** [GitHub Issues](https://github.com/gayathri-1911/pollgeneration/issues)
- **Discussions:** [GitHub Discussions](https://github.com/gayathri-1911/pollgeneration/discussions)
- **Email:** chaitanyabaggam3@gmail.com

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and test thoroughly
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request** with a clear description

### 🔧 **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Update documentation for changes
- Follow the existing code style
- Test on multiple browsers/devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for Whisper and GPT-3.5-turbo APIs
- **React and Node.js communities** for excellent frameworks
- **Tailwind CSS** for beautiful, utility-first styling
- **Socket.io** for seamless real-time communication
- **MongoDB** for reliable data storage

---

## 🚀 **Ready to Get Started?**

1. **Clone the repo:** `git clone https://github.com/gayathri-1911/pollgeneration.git`
2. **Setup environment:** Add your OpenAI API key
3. **Run the app:** `npm run dev` or use our automated scripts
4. **Start creating:** Record audio and generate intelligent polls!

**Built with ❤️ for enhanced educational experiences**

---

*Transform your teaching with AI-powered poll generation. Make learning interactive, engaging, and fun!* 🎓✨


---

## 🚀 Getting Started

### 🔧 Python Environment Setup

1. **Navigate to the Whisper service folder:**

```bash
cd services/whisper
```

2. **Create and activate a Python virtual environment:**

```bash
# Windows
python -m venv whisper-env
whisper-env\Scripts\activate

# macOS/Linux
python3 -m venv whisper-env
source whisper-env/bin/activate
```

3.1 **For CPU-only**

```bash
pip install --upgrade pip
pip install -r requirements.txt
````

This installs everything except large GPU-related packages like `torch`.
Useful for quickly running the backend in **CPU mode** for testing or development.


3.2 **⚡ For GPU support (CUDA 12.1)**

If you have a CUDA-enabled GPU and want to use GPU acceleration:

```bash
pip install -r requirements.gpu.txt --extra-index-url https://download.pytorch.org/whl/cu121
```

This will install `torch`, `torchaudio`, and `torchvision` with CUDA 12.1 support.
Make sure your system has the correct CUDA runtime installed.


## 🔧 .env Configuration

### `apps/backend/.env`

```
PORT=3000
WHISPER_WS_URL=ws://localhost:8000
```

### `apps/frontend/.env`

```
VITE_BACKEND_WS_URL=ws://localhost:3000
```

### Global Prerequisites
**Navigate to the root directory:**

Install `pnpm` and `turbo` globally (once):

```bash
npm install -g pnpm
pnpm add -g turbo
```
### 1. Install dependencies

```bash
pnpm install
```

### 2. Start all dev servers

```bash
pnpm dev
```
This starts:

* ✅ *Frontend* → [http://localhost:5173](http://localhost:5173)
* ✅ *Backend (WebSocket server)* → ws\://localhost:3000
* ✅ *Whisper Transcription Service* → ws\://localhost:8000 (Python FastAPI)

> Make sure the Python environment is set up correctly (faster-whisper, uvicorn, etc.)

## 🛆 Using Turborepo

* `pnpm build` → Build all apps/services
* `pnpm lint` → Lint all projects
* `pnpm test` → Run tests
* `turbo run <task>` → Run any task across monorepo


## 🗣 Phase 1 – Transcription Pipeline

> This outlines the current real-time transcription flow:

1. **Frontend** records or selects a `.wav` file and sends it over WebSocket (binary + metadata).
2. **Backend** WebSocket server receives and forwards it to the Whisper service.
3. **Whisper Service** processes audio using Faster-Whisper and returns transcription in JSON.
4. **Backend** sends transcription JSON back to the frontend or passes it to the LLM service.

> Currently, the transcription is **not displayed** to the user – it is **used internally** to generate polls using an LLM.

📅 Upcoming Phases:

* Phase 2: LLM-based Poll Generation
* Phase 3: Realtime Poll Launch and Analytics

- Monorepo powered by `pnpm` + `turborepo`
- Modular architecture for scalable development
- Each service/app can run independently or be combined via CI/CD
- CI/CD-ready with GitHub Actions

## 🧠 Whisper Service Setup (Audio Transcription)

This Python service uses [Faster-Whisper](https://github.com/guillaumekln/faster-whisper) for real-time transcription of meeting audio using Whisper models optimized via CTranslate2.

### 🔧 Python Environment Setup

1. **Navigate to the Whisper service folder:**

```bash
cd services/whisper
```

2. **Create a Python Virtual Environment:**

```bash
# Windows
python -m venv whisper-env
whisper-env\Scripts\activate

# macOS/Linux
python3 -m venv whisper-env
source whisper-env/bin/activate
```

3. **Upgrade pip and install dependencies:**

```bash
pip install --upgrade pip
pip install faster-whisper
```

4. **Test Installation:**

Run a quick test script (optional):

```python
# test_whisper.py
from faster_whisper import WhisperModel

model = WhisperModel("base", compute_type="float32")
segments, _ = model.transcribe("sample-audio.mp3")

for segment in segments:
    print(f"[{segment.start:.2f} -> {segment.end:.2f}] {segment.text}")
```

Then run it:

```bash
python test_whisper.py
```

5. **Model Download Note:**

The first time you run, the model (e.g., `"base"`) will download from HuggingFace. You can also download manually or cache using:

```python
from faster_whisper import WhisperModel
model = WhisperModel("base", download_root="./models")
```

6. **Recommended GPU Setup (Optional):**

To leverage GPU and faster inference:

```python
# Float16 for GPU (if supported)
model = WhisperModel("base", compute_type="float16")
```
