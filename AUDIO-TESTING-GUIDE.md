# 🎤 Audio Testing Guide for Poll Generation Platform

## 🎯 **Testing Overview**

The audio functionality includes:
- **Real-time audio recording** with live chunking
- **WebSocket streaming** of audio chunks during recording
- **AI-powered transcription** using OpenAI Whisper
- **Automatic poll generation** from transcribed content

## 🔧 **Setup for Testing**

### **1. Start the Application**
```bash
# From root directory
npm run dev

# This starts:
# - Frontend: http://localhost:3002
# - Backend: http://localhost:5001
```

### **2. Required Permissions**
- **Microphone access** - Browser will prompt for permission
- **HTTPS recommended** for production (localhost works for testing)

## 🧪 **Testing Scenarios**

### **Scenario 1: Basic Audio Recording**
1. **Navigate to Host Dashboard** → Audio Recording section
2. **Click "Start Recording"** 
3. **Speak for 30-60 seconds** about any educational topic
4. **Click "Stop & Process"**
5. **Verify:**
   - ✅ Recording duration shows correctly
   - ✅ Processing message appears
   - ✅ Transcript is generated
   - ✅ Poll questions are created

### **Scenario 2: Real-time Audio Streaming**
1. **Open browser developer tools** → Network/Console tab
2. **Start recording** and speak
3. **Monitor console logs** for:
   - ✅ "Audio stream started" message
   - ✅ "Received audio chunk X" messages every second
   - ✅ WebSocket connection active
   - ✅ Chunk counter incrementing in UI

### **Scenario 3: Multiple Participants Testing**
1. **Open multiple browser tabs/windows**
2. **Join same meeting ID** in each tab
3. **Start recording in host tab**
4. **Verify in participant tabs:**
   - ✅ "Audio stream started" notification
   - ✅ Real-time chunk reception logs
   - ✅ "Audio stream stopped" notification

### **Scenario 4: Error Handling**
1. **Test without microphone permission**
2. **Test with poor network connection**
3. **Test stopping recording mid-stream**
4. **Verify graceful error handling**

## 📊 **Expected Results**

### **Demo Mode (No OpenAI API Key):**
- **Transcript:** Demo text about React hooks
- **Poll Questions:** 3 predefined React-related questions
- **Status:** "Demo mode" messages in console

### **Full AI Mode (With OpenAI API Key):**
- **Transcript:** Actual transcription of your speech
- **Poll Questions:** AI-generated questions based on content
- **Status:** Real OpenAI API responses

## 🔍 **Testing Checklist**

### **Frontend Testing:**
- [ ] Microphone permission request
- [ ] Recording start/stop/pause controls
- [ ] Duration timer accuracy
- [ ] Real-time streaming indicator
- [ ] Chunk counter updates
- [ ] Error message display
- [ ] Success message display
- [ ] Transcript display
- [ ] Generated polls display

### **Backend Testing:**
- [ ] WebSocket connection establishment
- [ ] Audio chunk reception
- [ ] File upload processing
- [ ] OpenAI API integration
- [ ] Error handling and fallbacks
- [ ] Console logging accuracy

### **Real-time Features:**
- [ ] Live audio chunking (1-second intervals)
- [ ] WebSocket streaming during recording
- [ ] Participant notifications
- [ ] Stream start/stop events
- [ ] Chunk processing logs

## 🐛 **Common Issues & Solutions**

### **Issue: No microphone access**
- **Solution:** Check browser permissions, use HTTPS in production

### **Issue: WebSocket not connecting**
- **Solution:** Verify backend is running on port 5001

### **Issue: Audio chunks not streaming**
- **Solution:** Check console for WebSocket errors, verify Socket.io connection

### **Issue: AI processing fails**
- **Solution:** Check OpenAI API key, verify demo mode fallback

## 📱 **Browser Compatibility**

### **Supported:**
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### **Features:**
- ✅ MediaRecorder API
- ✅ WebSocket support
- ✅ FileReader API
- ✅ getUserMedia API

## 🎯 **Testing Team Instructions**

### **For Manual Testing:**
1. **Follow each scenario** step by step
2. **Document any issues** with screenshots
3. **Test on different browsers** and devices
4. **Verify real-time features** work consistently
5. **Check audio quality** and transcription accuracy

### **For Automated Testing:**
- **Unit tests** for audio processing functions
- **Integration tests** for WebSocket events
- **E2E tests** for complete recording workflow
- **Performance tests** for chunk streaming

## 🚀 **Production Considerations**

### **Before Production:**
- [ ] Add OpenAI API key to environment
- [ ] Configure HTTPS for secure microphone access
- [ ] Set up proper error monitoring
- [ ] Implement audio quality validation
- [ ] Add recording time limits
- [ ] Configure file size limits

**The testing team can now comprehensively test all audio features including real-time streaming! 🎉**
