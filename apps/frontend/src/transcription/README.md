# Transcription Module

This module provides real-time audio transcription functionality for both host and guest users in the poll automation system.

## Components

### Host Transcription
- **HostMicControls**: Main recording controls for the host
- **AudioCapture**: Full-featured host interface with advanced controls

### Guest Transcription  
- **GuestMicControls**: Simplified recording controls for guests
- **GuestPage**: Guest interface with microphone selection and live transcription display

## Workflow

### Host Workflow
1. Host selects microphone device
2. Starts recording with HostMicControls
3. Audio is processed and sent to backend WebSocket
4. Backend forwards audio to Whisper service
5. Transcriptions are returned and displayed
6. Transcriptions are buffered and sent to LLM service for poll generation

### Guest Workflow  
1. Guest accesses `/guest?meetingId=X&displayName=Y` URL
2. Guest selects microphone and starts recording
3. Audio follows same pipeline as host (WebSocket → Backend → Whisper → LLM)
4. Guest sees real-time transcriptions
5. Guest transcriptions contribute to poll generation alongside host transcriptions

## Key Features

- **Real-time transcription**: Live speech-to-text processing
- **Multi-participant support**: Both host and guests can contribute transcriptions
- **Automatic poll generation**: LLM processes all transcriptions to generate educational questions
- **Device selection**: Microphone device enumeration and selection
- **Live feedback**: Real-time transcription display for immediate feedback

## Technical Details

- **Audio Processing**: 16kHz sample rate, WAV encoding
- **WebSocket Communication**: Real-time bidirectional communication
- **Buffering Strategy**: 30-second transcript buffering before LLM processing
- **Error Handling**: Graceful fallbacks for device access and connection issues

## Environment Variables

```env
VITE_BACKEND_WS_URL=ws://localhost:3000
VITE_CHUNK_INTERVAL=30000
```

## Usage

### Host
```tsx
import HostMicControls from './components/HostMicControls';

<HostMicControls meetingId="meeting123" />
```

### Guest
```tsx
import GuestMicControls from './components/GuestRecorder';

<GuestMicControls 
  guestId="guest123" 
  meetingId="meeting123"
  onTranscriptionReceived={(text) => console.log(text)}
/>
```
