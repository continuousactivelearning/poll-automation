# 🎤 PollGen AI - Smart Poll Generation Platform

An AI-powered educational platform that generates intelligent poll questions from voice recordings using OpenAI's Whisper and GPT-3.5-turbo.

![PollGen AI](https://img.shields.io/badge/AI-Powered-blue) ![React](https://img.shields.io/badge/React-18.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18.0-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0+
- npm or yarn
- OpenAI API key

### Installation

#### **Option 1: Quick Start (Recommended)**
```bash
# Clone the repository
git clone https://github.com/chaiayabaggam/pollgen-ai.git
cd pollgen-ai

# Run development script
# On Windows:
.\scripts\dev.ps1

# On Unix/Linux/macOS:
chmod +x scripts/dev.sh
./scripts/dev.sh
```

#### **Option 2: Manual Setup**
```bash
# 1. Clone and navigate
git clone https://github.com/chaiayabaggam/pollgen-ai.git
cd pollgen-ai

# 2. Install all dependencies (monorepo)
npm install

# 3. Build shared package
npm run build --workspace=packages/shared

# 4. Setup environment
cp packages/server/.env.example packages/server/.env
# Edit packages/server/.env and add your OpenAI API key

# 5. Start development servers
npm run dev
```

#### **Option 3: Docker Setup**
```bash
# Clone repository
git clone https://github.com/chaiayabaggam/pollgen-ai.git
cd pollgen-ai

# Create .env file
cp packages/server/.env.example packages/server/.env
# Add your OpenAI API key to packages/server/.env

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
```

### **Access Points**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Documentation:** http://localhost:5000/api/docs

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

## 📁 Monorepo Structure

```
pollgen-ai/
├── packages/
│   ├── client/            # React frontend (@pollgen-ai/client)
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── pages/         # Main page components
│   │   │   ├── contexts/      # React contexts
│   │   │   └── styles/        # CSS and animations
│   │   ├── Dockerfile     # Client container config
│   │   └── nginx.conf     # Nginx configuration
│   ├── server/            # Node.js backend (@pollgen-ai/server)
│   │   ├── src/
│   │   │   ├── routes/        # API routes
│   │   │   ├── models/        # Data models
│   │   │   └── index.ts       # Server entry point
│   │   └── Dockerfile     # Server container config
│   └── shared/            # Shared utilities (@pollgen-ai/shared)
│       ├── src/
│       │   ├── types/         # TypeScript interfaces
│       │   ├── utils/         # Common utilities
│       │   └── constants/     # App constants
│       └── package.json   # Shared package config
├── scripts/               # Development scripts
│   ├── dev.sh            # Unix development script
│   └── dev.ps1           # Windows development script
├── docker-compose.yml     # Multi-container setup
├── package.json          # Root workspace configuration
└── README.md
```

## 🎯 Usage

### For Hosts
1. Sign up as "Meeting Host"
2. Navigate to "Live Meeting"
3. Connect to your meeting
4. Use "AI Audio Recording" to generate polls
5. Monitor participant responses in real-time

### For Students
1. Sign up as "Participant"
2. Enter meeting code in "Active Poll"
3. Answer polls and earn points
4. Track progress and achievements
5. Compete on leaderboards

## 🔧 Configuration

### Environment Variables
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/poll-generation
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key-here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for Whisper and GPT-3.5-turbo APIs
- React and Node.js communities
- Tailwind CSS for beautiful styling

---

**Built with ❤️ for enhanced educational experiences**
