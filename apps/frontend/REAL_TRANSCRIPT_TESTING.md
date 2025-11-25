# 🎤 Real Transcript Testing Instructions (Updated)

## Current Fixes Applied:
1. ✅ Enhanced console capture system to handle multiple console.log overrides
2. ✅ Fixed backend API integration to use correct endpoint `/api/transcripts/:meetingId`
3. ✅ Added automatic localStorage sync when backend transcripts are found
4. ✅ Improved console detection with better argument parsing

## Testing Steps:

### Step 1: Start Both Servers
```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend  
cd apps/frontend
npm run dev
```

### Step 2: Test Console Capture (Method 1)
1. Go to: http://localhost:5174
2. Navigate to AI Questions page
3. Open Developer Tools (F12) → Console tab
4. You should see: `✅ [CAPTURE-INIT] Console capture active for meeting: test-room-id`

#### Manual Console Test
Copy and paste this into the console:
```javascript
// Test the improved console capture system
const realTranscript = {
  endTime: 1759075849648,
  meetingId: "test-room-id", 
  participantId: "68d77e7638e27a6a4f2d27c1",
  role: "host",
  startTime: 1759075849648,
  text: "This is a test transcript about programming languages including C, Python, and JavaScript for computer science education",
  timestamp: 1759075849648,
  type: "final"
};

console.log("📝 [AUDIOCAPTURE] Received transcript:", realTranscript);
```

**Expected Result:**
- ✅ `🔍 [CAPTURE-DEBUG] *** AUDIOCAPTURE DETECTED ***`
- ✅ `🔍 [CAPTURE-DEBUG] Found transcript object at arg[1]!`
- ✅ `🎤 [AUTO-CAPTURE] Processing AUDIOCAPTURE transcript`
- ✅ `💾 [AUTO-CAPTURE] Saved transcript for meeting: test-room-id`
- ✅ `📡 [AUTO-CAPTURE] Dispatched transcript-captured event`

### Step 3: Test Backend API Fallback (Method 2)
1. Clear localStorage: `localStorage.clear()`
2. Ensure backend has transcripts for "test-room-id" meeting
3. Refresh the AI Questions page
4. Check console for: `📡 No local transcripts found, trying backend API...`

**Expected Result:**
- ✅ `✅ Backend API response: {success: true, data: [...]}`
- ✅ `💾 Stored X backend transcripts to localStorage`
- ✅ Toast: "Loaded X transcripts from database"

### Step 4: UI Verification  
The AI Questions page should show:
- Meeting ID: "test-room-id" (not "demo-meeting-123")
- Transcript count: "1 transcript found" 
- Generate Questions button should be **enabled**

### Step 5: Test Complete Workflow
1. **Voice Recording → Backend Storage:** Use your voice recording system
2. **Console Logs:** Check for `📝 [AUDIOCAPTURE] Received transcript:` messages
3. **Console Capture:** Automatic detection and localStorage storage
4. **Backend Fallback:** If console fails, API loads from database
5. **Question Generation:** Click "Generate Questions" button

### Step 6: Debug Console Issues (If Needed)
If console capture is still not working, run this diagnostic:
```javascript
// Check if console.log is being overridden multiple times
console.log("Current console.log includes captureConsoleLog:", 
  console.log.toString().includes('captureConsoleLog'));
```

## Advanced Testing:

### Backend API Direct Test
```bash
# Test if backend has transcripts
curl http://localhost:3000/api/transcripts/test-room-id
```

### WebSocket Transcript Injection
```javascript
// Simulate WebSocket saving transcript to backend
fetch('/api/transcripts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    meetingId: "test-room-id",
    role: "host", 
    participantId: "test-participant",
    transcripts: [{
      text: "Test transcript for API integration",
      type: "final",
      startTime: Date.now(),
      endTime: Date.now(),
      timestamp: Date.now()
    }]
  })
});
```

## Expected Complete Flow:
```
Voice Recording 
→ WebSocket Message 
→ Backend Storage (MongoDB) 
→ [AUDIOCAPTURE] Console Log 
→ Frontend Console Capture OR Backend API Fallback
→ localStorage Storage 
→ AI Questions Page Update 
→ Generate Questions Button Enabled 
→ Mock/Real Question Generation
```

## Gemini API Setup (Optional):
1. Get API key from: https://makersuite.google.com/app/apikey
2. Create `.env` file in frontend folder:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Restart the development server
4. Real AI questions will be generated instead of mock questions

## Troubleshooting (Updated):
- **Console capture fails**: Backend API will automatically load transcripts
- **Backend API fails**: Check if backend server is running on port 3000
- **No transcripts anywhere**: Verify voice recording is actually generating WebSocket messages
- **Questions generation fails**: Mock questions will be used if no Gemini API key
- **Still showing demo-meeting-123**: Clear browser localStorage manually
- **Generate Questions disabled**: System will try both console capture AND backend API

**The system now has dual redundancy - console capture AND backend API fallback!**