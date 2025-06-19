# 🚀 Complete Setup Guide - Poll Automation

## 📋 Prerequisites

### Required Software
- **Node.js 18+**: [Download here](https://nodejs.org/)
- **pnpm**: Install with `npm install -g pnpm`
- **Python 3.8+**: [Download here](https://python.org/) (for Whisper service)
- **Git**: [Download here](https://git-scm.com/)

### Optional (for full AI features)
- **MongoDB**: [Download here](https://mongodb.com/) or use MongoDB Atlas
- **Gemini API Key**: [Get free key here](https://makersuite.google.com/app/apikey)

## 🔧 Quick Setup (5 Minutes)

### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/gayathri-1911/poll-automation.git
cd poll-automation

# Install all dependencies
pnpm install
```

### Step 2: Setup Environment Files
```bash
# Create backend environment file
cp apps/backend/.env.example apps/backend/.env

# Create frontend environment file  
cp apps/frontend/.env.example apps/frontend/.env

# Optional: Edit apps/backend/.env to add your Gemini API key
# GEMINI_API_KEY=your-api-key-here
```

### Step 3: Setup Whisper Service (Python)

**Windows:**
```bash
cd services/whisper
setup.bat
cd ../..
```

**Linux/Mac:**
```bash
cd services/whisper
chmod +x setup.sh
./setup.sh
cd ../..
```

**Manual Setup (if scripts don't work):**
```bash
cd services/whisper
python -m venv whisper-env

# Windows:
whisper-env\Scripts\activate
whisper-env\Scripts\pip install -r requirements.txt

# Linux/Mac:
source whisper-env/bin/activate
pip install -r requirements.txt

cd ../..
```

### Step 4: Start All Services
```bash
# Start everything at once
pnpm dev

# Or start individually:
# pnpm dev:frontend  # Port 5173
# pnpm dev:backend   # Port 3000
# pnpm dev:whisper   # Port 8000
```

### Step 5: Verify Setup
- **Frontend**: http://localhost:5173 (should show landing page)
- **Backend**: http://localhost:3000 (should show "Poll Generation API is running")
- **Whisper**: http://localhost:8000 (should show FastAPI docs)

## 🐛 Troubleshooting

### Issue: "Cannot find .env.example"
**Solution**: The files are now created. Run the setup commands again.

### Issue: "Command dev:frontend not found"
**Solution**: Use the correct commands:
```bash
pnpm dev:frontend  # ✅ Correct
npm run dev:frontend  # ❌ Wrong
```

### Issue: "Whisper service fails to start"
**Solution**: Setup Python virtual environment:
```bash
cd services/whisper
# Windows:
python -m venv whisper-env
whisper-env\Scripts\pip install -r requirements.txt

# Linux/Mac:
python3 -m venv whisper-env
source whisper-env/bin/activate
pip install -r requirements.txt
```

### Issue: "Port already in use"
**Solution**: Kill existing processes:
```bash
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill -9
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Issue: "MongoDB connection error"
**Solution**: Either install MongoDB locally or use demo mode (works without DB).

### Issue: "Dependencies not installing"
**Solution**: Clean install:
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 🎯 Testing the Setup

### Quick Test Checklist
- [ ] Frontend loads at http://localhost:5173
- [ ] Can register a new user account
- [ ] Can login with created account
- [ ] Backend API responds at http://localhost:3000
- [ ] Whisper service shows docs at http://localhost:8000
- [ ] No console errors in browser

### Full Feature Test
1. **Register** as a "Meeting Host"
2. **Navigate** to "Live Meeting" tab
3. **Click** "AI Audio Recording"
4. **Record** 10 seconds of audio or upload a WAV file
5. **Verify** transcription and poll generation works

## 📦 Available Scripts

```bash
# Development
pnpm dev                 # Start all services
pnpm dev:frontend        # Frontend only (port 5173)
pnpm dev:backend         # Backend only (port 3000)
pnpm dev:whisper         # Whisper service only (port 8000)

# Building
pnpm build               # Build all packages
pnpm build:frontend      # Build frontend only
pnpm build:backend       # Build backend only

# Testing & Quality
pnpm test                # Run all tests
pnpm lint                # Lint all code
pnpm type-check          # TypeScript type checking
pnpm clean               # Clean build artifacts
```

## 🔧 Configuration

### Backend Configuration (apps/backend/.env)
```env
PORT=3000                                    # Backend port
CLIENT_URL=http://localhost:5173            # Frontend URL
MONGO_URI=mongodb://localhost:27017/poll-automation  # Database
GEMINI_API_KEY=your-key-here                # AI service (optional)
```

### Frontend Configuration (apps/frontend/.env)
```env
VITE_API_URL=http://localhost:3000          # Backend API URL
VITE_WS_URL=ws://localhost:3000             # WebSocket URL
```

## 🚀 Production Setup

### Environment Variables
```bash
# Production backend .env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/poll-automation
GEMINI_API_KEY=your-production-api-key
CLIENT_URL=https://your-frontend-domain.com
```

### Build for Production
```bash
pnpm build
```

### Docker Setup (Optional)
```bash
# If docker-compose.yml exists:
docker-compose up -d
```

## 📞 Getting Help

### Common Commands Reference
```bash
# Check what's running on ports
netstat -ano | findstr :5173  # Windows
lsof -i :5173                 # Linux/Mac

# Restart services
pnpm dev

# Check logs
# Look at terminal output where you ran pnpm dev

# Reset everything
rm -rf node_modules
pnpm install
pnpm dev
```

### Support Channels
- **GitHub Issues**: [Create an issue](https://github.com/gayathri-1911/poll-automation/issues)
- **Email**: chaitanyabaggam3@gmail.com
- **Documentation**: Check README.md and other guide files

## ✅ Success Indicators

You'll know setup is successful when:
- ✅ All three services start without errors
- ✅ Frontend shows the landing page
- ✅ You can register and login
- ✅ Audio recording/upload works
- ✅ Real-time features work between browser tabs

**Happy coding! 🎉**
