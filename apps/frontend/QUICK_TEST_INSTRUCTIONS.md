# 🎤 Quick Test Instructions

## Step 1: Test the Console Capture
1. Open your React app (AI Questions page)
2. Open browser Developer Tools (F12) → Console tab
3. Copy and paste this test script:

```javascript
// Test script - copy and paste into console
const testTranscript = {
  type: 'final',
  meetingId: 'test-room-id', 
  role: 'host',
  participantId: '68d77e7638e27a6a4f2d27c1',
  text: 'today we got discuss about artificial intelligence artificial intelligence is a branch of science',
  timestamp: Date.now(),
  confidence: 0.878570556640625
};

console.log("📝 [AUDIOCAPTURE] Received transcript:", testTranscript);
```

## Step 2: Check for Success Messages
After pasting, look for these console messages:
- ✅ `🔍 [CAPTURE-DEBUG] Detected AUDIOCAPTURE transcript message`
- ✅ `🎤 [AUTO-CAPTURE] Capturing AUDIOCAPTURE transcript`  
- ✅ `💾 [AUTO-CAPTURE] Saved transcript for meeting: test-room-id`
- ✅ `📡 [AUTO-CAPTURE] Dispatched transcript-captured event`
- ✅ `🔄 [AI-QUESTIONS] Switching to active meeting: test-room-id`

## Step 3: Check UI Changes
- Meeting ID should change from "demo-meeting-123" to "test-room-id"
- Transcript count should show "1 transcript found"
- Generate Questions button should become enabled

## Step 4: Test with Your Voice System
Once the test works, try recording voice in your app. You should see the same success messages when your voice system outputs:
```
📝 [AUDIOCAPTURE] Received transcript: {transcript object}
```

## If It Doesn't Work:
1. Check if any error messages appear in console
2. Check if localStorage has transcripts: `localStorage.getItem('local-transcripts')`
3. Make sure you're on the AI Questions page when testing
4. Try refreshing the page and testing again