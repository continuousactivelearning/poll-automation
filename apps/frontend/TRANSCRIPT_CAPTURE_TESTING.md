# 🎤 Transcript Capture System - Testing Guide

## Overview
The transcript capture system automatically detects `[AUDIOCAPTURE]` console messages and stores the transcript data in localStorage for AI question generation.

## How It Works

### 1. Console Message Detection
The system intercepts `console.log()` calls and looks for this specific format:
```javascript
console.log("[AUDIOCAPTURE] Received transcript:", transcriptObject);
```

### 2. Transcript Object Structure
The expected transcript object format:
```javascript
{
  "text": "The actual transcript text content...",
  "type": "final",  // Only 'final' transcripts are captured
  "timestamp": 1703123456789,
  "meetingId": "test-room-id",
  "participantId": "host-123", 
  "role": "host"  // or "guest"
}
```

### 3. Storage Process
- Extracts transcript from `args[1]` of console.log
- Validates it's a final transcript with meaningful content (>5 chars)
- Converts to internal format with proper speaker mapping
- Stores in localStorage under key `'local-transcripts'`
- Triggers `'transcript-captured'` event for UI updates

## Testing the System

### Option 1: Test HTML Page
1. Open `test-transcript-capture.html` in your browser
2. Click "🧪 Run Transcript Capture Test" to simulate a single transcript
3. Click "📝 Add Multiple Test Transcripts" to add several transcripts
4. Use "🔍 Check Storage Status" to verify storage
5. Use "🧠 Check AI Readiness" to see if you have enough content

### Option 2: Browser Console Test
1. Open your browser's developer console
2. Copy and run the code from `test-transcript-capture.js`
3. Watch the console output for success/failure messages

### Option 3: Integration with Your App
If you have the frontend running:
1. Open the AI Questions page
2. The console capture should be active automatically
3. Any `[AUDIOCAPTURE]` messages will be captured
4. The meeting ID will auto-switch to match captured transcripts

## Expected Behavior

### When Working Correctly:
- Console shows: `🎤 [AUTO-CAPTURE] Capturing AUDIOCAPTURE transcript: "..."`
- localStorage contains transcript data
- AI Questions page shows transcript count and enables "Generate Questions"
- Meeting ID auto-switches from "demo-meeting-123" to actual meeting ID (e.g., "test-room-id")

### Troubleshooting:
- **No capture**: Check console for parsing errors
- **Wrong meeting ID**: System should auto-switch to detected meeting
- **Not ready for AI**: Need at least 100 words across 3+ transcripts
- **Console errors**: Check transcript object format matches expected structure

## File Locations
- Main hook: `apps/frontend/src/hooks/useTranscriptCapture.ts`
- AI Questions page: `apps/frontend/src/pages/AIQuestionFeed.tsx`  
- Storage utility: `apps/frontend/src/utils/localTranscripts.ts`
- Test files: `apps/frontend/test-transcript-capture.*`

## Integration Points

### With Voice Recording System:
Your voice recording should output:
```javascript
console.log("[AUDIOCAPTURE] Received transcript:", {
  text: "transcribed speech...",
  type: "final",
  meetingId: "actual-room-id",
  // ... other properties
});
```

### With AI Questions Page:
- Automatically detects new transcripts
- Switches meeting ID to active session
- Updates transcript count and readiness status
- Enables question generation when sufficient content available

## Success Criteria
✅ Console messages are captured automatically  
✅ Transcripts stored in localStorage  
✅ Meeting ID switches to active session  
✅ AI Questions page shows transcript data  
✅ Generate Questions button becomes enabled  
✅ Questions generated using real voice transcript content