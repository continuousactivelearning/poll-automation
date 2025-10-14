# 🚀 PollGen Cloud Deployment Guide

## ✅ What We've Prepared (Without Affecting Your Local Code)

### Files Added (Your working code is UNTOUCHED):
- `apps/backend/.env.production` - Production environment variables
- `apps/frontend/.env.production` - Frontend production variables  
- `apps/backend/render-build.sh` - Render build script
- `apps/backend/render.yaml` - Render configuration
- `vercel.json` - Vercel deployment configuration
- Added deployment scripts to package.json files

### Enhanced (Safely):
- Backend CORS now supports both local (localhost:5174) AND production URLs
- All your existing functionality preserved

---

## 🔧 Before Deployment: Get Your API Keys

### 1. Get Gemini API Key:
- Go to https://makersuite.google.com/app/apikey
- Create new API key
- Copy the key (looks like: AIzaSyC...)

### 2. Your MongoDB URI (Already Set):
```
mongodb+srv://sashipavan:SESSI111111@@@@@@cluster0.tjsej5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

---

## 🌐 STEP 1: Deploy Backend to Render

### 1.1 Create Render Account:
- Go to https://render.com
- Sign up with GitHub
- Connect your repository

### 1.2 Create New Web Service:
1. Click "New +" → "Web Service"
2. Select your GitHub repository: `Automatic-poll-generation`
3. Configure:
   - **Name**: `pollgen-backend`
   - **Root Directory**: `apps/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render:build`
   - **Start Command**: `npm run render:start`
   - **Plan**: Free

### 1.3 Add Environment Variables in Render:
Go to Environment section and add:
```
PORT=8000
NODE_ENV=production
MONGODB_URI=mongodb+srv://sashipavan:SESSI111111@@@@@@cluster0.tjsej5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
GEMINI_API_KEY=AIzaSyC... (your actual key)
FRONTEND_URL=https://your-frontend-name.vercel.app
```

### 1.4 Deploy:
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Copy your backend URL: `https://pollgen-backend-xyz.onrender.com`

---

## ☁️ STEP 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account:
- Go to https://vercel.com
- Sign up with GitHub

### 2.2 Import Project:
1. Click "New Project"
2. Import your GitHub repository
3. Configure:
   - **Project Name**: `pollgen-frontend`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.3 Add Environment Variables in Vercel:
Go to Settings → Environment Variables:
```
VITE_BACKEND_URL=https://automatic-poll-generation-backend.onrender.com
VITE_WS_URL=wss://automatic-poll-generation-backend.onrender.com 
VITE_GEMINI_API_KEY=AIzaSyCJoHEBAHDn6yDRSbwogerrpHF-tw5_Mjk
```

### 2.4 Deploy:
- Click "Deploy"
- Wait for build (2-5 minutes)
- Copy your frontend URL: `https://pollgen-frontend-xyz.vercel.app`

---

## 🔄 STEP 3: Connect Frontend & Backend

### 3.1 Update Backend Environment in Render:
- Go to your Render service dashboard
- Environment → Edit
- Update `FRONTEND_URL` to your actual Vercel URL:
```
FRONTEND_URL=https://automatic-poll-generation-frontend.vercel.app/
```
- Save and redeploy

### 3.2 Update Frontend Environment in Vercel:
- Go to your Vercel project dashboard  
- Settings → Environment Variables
- Update URLs to your actual Render backend:
```
VITE_BACKEND_URL=https://pollgen-backend-xyz.onrender.com
VITE_WS_URL=wss://pollgen-backend-xyz.onrender.com
```
- Redeploy frontend

---

## 🧪 STEP 4: Test Your Deployment

### 4.1 Test Backend:
- Visit: `https://pollgen-backend-xyz.onrender.com`
- Should show: "PollGen Backend is running."

### 4.2 Test Frontend:
- Visit: `https://pollgen-frontend-xyz.vercel.app`
- Should load your PollGen interface

### 4.3 Test Features:
- ✅ Create session/room
- ✅ Audio capture and transcription
- ✅ AI question generation
- ✅ Poll launching
- ✅ Real-time features

---

## 📱 STEP 5: Access From All Devices

Once deployed, share these URLs:

### For Hosts:
- Main App: `https://pollgen-frontend-xyz.vercel.app`
- All features work: audio capture, AI questions, poll management

### For Students:  
- Poll Access: `https://pollgen-frontend-xyz.vercel.app/student/join`
- Students enter the room code to join polls

### Multi-Device Access:
- ✅ Any computer (Windows, Mac, Linux)
- ✅ Mobile phones (iPhone, Android)
- ✅ Tablets (iPad, Android tablets)
- ✅ Different networks (home, office, mobile data)
- ✅ Multiple users simultaneously

---

## 🔒 Security & Performance

### Production Ready:
- ✅ HTTPS/SSL certificates (automatic)
- ✅ CORS properly configured
- ✅ Environment variables secured
- ✅ WebSocket support (real-time features)
- ✅ Global CDN (fast loading worldwide)

### Cost:
- 🆓 Render Free: 750 hours/month (sufficient)
- 🆓 Vercel Free: Unlimited personal projects
- 🆓 MongoDB Atlas: 512MB free storage
- 💰 Gemini API: Pay-per-use (very affordable)

---

## 🚨 Important Notes

### Your Local Development Stays the Same:
- ✅ `npm run dev` still works exactly as before
- ✅ All your localhost:5174 and localhost:8000 functionality preserved
- ✅ No code changes needed for local development
- ✅ Switch between local and production seamlessly

### If Something Goes Wrong:
- Your local code is completely unaffected
- Just continue using localhost as before
- Production deployment is completely separate

---

## 🎉 After Deployment Success

You'll have:
- 🌐 **Global Access**: Your app works from anywhere in the world
- 📱 **Multi-Device**: Works on phones, tablets, computers
- 👥 **Multi-User**: Multiple people can use simultaneously
- ⚡ **Fast Performance**: Global CDN ensures quick loading
- 🔒 **Secure**: HTTPS encryption and proper authentication
- 💾 **Persistent**: Data saved to MongoDB Atlas cloud database

Your PollGen app will be a professional, cloud-hosted solution accessible 24/7 from any device!

## Need Help?
If you encounter any issues during deployment, I can help troubleshoot and guide you through any step.