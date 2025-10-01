# Audio Capture & Real-Time Transcription System

## Overview

The Host Audio Capture feature provides real-time audio recording and transcription capabilities using WebSocket streaming and ASR (Automatic Speech Recognition). This system captures both microphone and system audio, streams it in real-time to a backend ASR service, and displays live transcriptions with database persistence.

## Features

✅ **Real-time Audio Streaming**: Captures microphone + system audio and streams PCM16 audio chunks via WebSocket  
✅ **Live Transcription**: Displays partial and final transcripts with <1-3s latency  
✅ **Database Persistence**: Stores final transcripts in MongoDB when recording stops  
✅ **Multi-source Audio**: Combines microphone and system audio (when screen share is enabled)  
✅ **Connection Recovery**: Automatic WebSocket reconnection with exponential backoff  
✅ **Export Functionality**: Download transcripts as text files with timestamps  
✅ **Real-time Waveform**: Visual audio activity indicator  
✅ **Status Indicators**: Connection status, recording state, and error handling  

## Architecture

```
Frontend (React + Vite)
├── AudioCapture.tsx          # Main UI component
├── audioStreamer.ts          # Audio processing & WebSocket streaming
└── api.ts                    # Transcript API integration

Backend (Node.js + Express)
├── asrHandler.ts             # WebSocket server for ASR
├── transcript.model.ts       # MongoDB schema
├── transcript.controller.ts  # REST API endpoints
└── transcript.routes.ts      # API routes

ASR Integration
├── WebSocket Protocol        # Audio chunk streaming
├── Mock ASR Service         # Demo transcription (replace with Vosk/OpenAI)
└── PCM16 Audio Processing   # 16kHz mono audio optimization
```

## Usage

### 1. Host Audio Capture

Navigate to `/audio-capture` in the host dashboard:

1. **Start Recording**: Click the microphone button to begin
2. **System Audio**: Check "Include System Audio" and share screen/tab with audio
3. **Live Transcription**: Watch partial transcripts appear in real-time
4. **Final Transcripts**: Completed transcriptions are saved automatically
5. **Export**: Download transcript as text file with timestamps

### 2. WebSocket Connection

The system automatically connects to: `ws://localhost:8000/ws/asr`

**Connection Parameters**:
- `meetingId`: Current room/session ID
- `role`: 'host' or 'participant' 
- `participantId`: User ID

**Audio Streaming Protocol**:
```javascript
// JSON message for session start
{
  type: 'start_session',
  meetingId: 'room123',
  role: 'host',
  participantId: 'user456',
  sampleRate: 16000,
  channels: 1
}

// Binary audio chunks (PCM16 format)
// Sent every 250ms as ArrayBuffer

// Finalization message
{
  type: 'finalize',
  meetingId: 'room123',
  role: 'host',
  participantId: 'user456'
}
```

**Transcript Responses**:
```javascript
// Partial transcript (real-time)
{
  type: 'partial',
  meetingId: 'room123',
  role: 'host',
  text: 'we are discussing the implementation of...',
  timestamp: 1640995200000
}

// Final transcript (saved to DB)
{
  type: 'final',
  meetingId: 'room123', 
  role: 'host',
  text: 'We are discussing the implementation of real-time transcription.',
  startTime: 1640995195000,
  endTime: 1640995205000,
  timestamp: 1640995205000
}
```

### 3. API Endpoints

**Get Transcripts**: `GET /api/transcripts/:meetingId`
- Query params: `type`, `role`, `participantId`

**Full Transcript**: `GET /api/transcripts/:meetingId/full`
- Returns formatted transcript with speakers and timestamps

**Export Transcript**: `GET /api/transcripts/:meetingId/export`
- Downloads text file with complete transcript

**Statistics**: `GET /api/transcripts/:meetingId/stats`
- Returns word count, duration, participant breakdown

## Technical Implementation

### Frontend Audio Processing

```typescript
// Initialize audio with microphone + system audio
const audioStreamer = new AudioStreamer(wsUrl, meetingId, userId, 'host');

await audioStreamer.initializeAudio(includeSystemAudio);
await audioStreamer.startRecording();

// Set up transcript callbacks
audioStreamer.setCallbacks({
  onTranscript: (message) => {
    // Handle partial/final transcripts
    setTranscriptLines(prev => [...prev, newTranscript]);
  },
  onStatusChange: (status) => {
    // Update UI status indicators
    setRecordingStatus(status);
  },
  onError: (error) => {
    // Handle connection/permission errors
    toast.error(error);
  }
});
```

### Audio Processing Pipeline

1. **MediaRecorder** captures WebM/Opus audio
2. **AudioContext** decodes and resamples to 16kHz PCM16
3. **WebSocket** streams 250ms audio chunks
4. **Backend ASR** processes chunks and returns transcripts
5. **MongoDB** stores final transcripts with metadata

### Backend ASR Integration

Current implementation includes a **mock ASR service** for demonstration. For production, integrate with:

**Vosk (Recommended)**:
```javascript
const vosk = require('vosk');
const model = new vosk.Model('path/to/vosk-model');
const recognizer = new vosk.KaldiRecognizer(model, 16000);

if (recognizer.acceptWaveform(audioChunk)) {
  const result = JSON.parse(recognizer.result());
  // Send final transcript
} else {
  const partial = JSON.parse(recognizer.partialResult());
  // Send partial transcript
}
```

**OpenAI Whisper**:
```javascript
const openai = new OpenAI();
const transcript = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  response_format: 'text'
});
```

## Configuration

### Environment Variables

```bash
# Backend
FRONTEND_URL=http://localhost:5174
MONGODB_URI=mongodb://localhost:27017/pollgen
ASR_SERVICE_URL=ws://localhost:9001  # For external ASR service

# Optional: Vosk model path
VOSK_MODEL_PATH=/path/to/vosk-model-small-en-us-0.15
```

### Audio Settings

```javascript
// Optimal settings for ASR
const audioConfig = {
  sampleRate: 16000,    // Vosk/Whisper optimal
  channels: 1,          // Mono for ASR
  bitDepth: 16,         // PCM16 format
  bufferSize: 4096      // Real-time processing
};
```

## Troubleshooting

### Common Issues

**"Microphone access denied"**
- Enable microphone permissions in browser settings
- Ensure HTTPS for production deployments

**"System audio unavailable"**  
- Click "Share Screen" and select "Share audio" option
- Choose specific tab/application with audio

**"Connection to transcription service failed"**
- Verify WebSocket server is running on port 8000
- Check firewall settings for WebSocket connections

**"No transcripts appearing"**
- Check browser console for WebSocket messages
- Verify audio is being detected in waveform visualizer
- Test with mock ASR service first

### Debug Mode

Enable detailed logging:

```javascript
// Frontend
localStorage.setItem('debug', 'audio-capture');

// Backend  
DEBUG=asr:* npm run dev
```

## Performance Optimization

### Audio Quality vs Bandwidth

```javascript
// High quality (more bandwidth)
mediaRecorder = new MediaRecorder(stream, {
  audioBitsPerSecond: 256000,
  mimeType: 'audio/webm; codecs=opus'
});

// Optimized for ASR (recommended)
mediaRecorder = new MediaRecorder(stream, {
  audioBitsPerSecond: 128000,
  mimeType: 'audio/webm; codecs=opus'
});
```

### Chunk Size Optimization

```javascript
// Real-time (250ms chunks)
mediaRecorder.start(250);  // Good balance of latency/accuracy

// High accuracy (1s chunks) 
mediaRecorder.start(1000); // Better for final transcripts

// Ultra real-time (100ms chunks)
mediaRecorder.start(100);  // May reduce accuracy
```

## Production Deployment

### ASR Service Integration

1. **Vosk Server**: Deploy Vosk as a separate microservice
2. **Cloud ASR**: Integrate with Google Cloud Speech-to-Text, AWS Transcribe, or Azure Speech
3. **Whisper**: Self-hosted OpenAI Whisper with GPU acceleration

### Security Considerations

- Enable HTTPS for WebRTC audio capture
- Implement rate limiting on WebSocket connections  
- Add authentication for transcript API endpoints
- Encrypt audio data in transit and at rest
- Implement retention policies for audio files

### Scaling

- Use Redis for WebSocket session management
- Implement horizontal scaling for ASR workers
- Add CDN for audio file storage and delivery
- Monitor WebSocket connection limits

This implementation provides a solid foundation for real-time audio transcription that can be extended with production-grade ASR services and scaled for enterprise use.