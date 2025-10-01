// Test client for ASR WebSocket connection
// Run with: node test-asr-client.js

const WebSocket = require('ws');
const fs = require('fs');

// Test configuration
const WS_URL = 'ws://localhost:8000/ws/asr?meetingId=test-room&role=host&participantId=test-user';

// Mock PCM16 audio data (sine wave for testing)
function generateMockPCM16(duration = 1000, frequency = 440) {
  const sampleRate = 16000;
  const samples = Math.floor(sampleRate * duration / 1000);
  const buffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample

  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * frequency * time);
    const sample = Math.floor(amplitude * 32767); // 16-bit range
    buffer.writeInt16LE(sample, i * 2);
  }

  return buffer;
}

function testASRConnection() {
  console.log('🎙️ Testing ASR WebSocket connection...');
  console.log(`Connecting to: ${WS_URL}`);

  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');

    // Send session start message
    const startMessage = {
      type: 'start_session',
      meetingId: 'test-room',
      role: 'host',
      participantId: 'test-user',
      timestamp: Date.now(),
      sampleRate: 16000,
      channels: 1
    };

    console.log('📤 Sending session start message...');
    ws.send(JSON.stringify(startMessage));

    // Simulate audio streaming
    let chunkCount = 0;
    const maxChunks = 10; // Send 10 audio chunks

    const audioInterval = setInterval(() => {
      if (chunkCount >= maxChunks) {
        clearInterval(audioInterval);
        
        // Send finalization message
        const finalizeMessage = {
          type: 'finalize',
          meetingId: 'test-room',
          role: 'host',
          participantId: 'test-user',
          timestamp: Date.now()
        };

        console.log('🏁 Sending finalization message...');
        ws.send(JSON.stringify(finalizeMessage));

        // Close connection after a delay
        setTimeout(() => {
          console.log('🔚 Closing connection...');
          ws.close();
        }, 2000);

        return;
      }

      // Send audio chunk header
      const chunkMessage = {
        type: 'audio_chunk',
        meetingId: 'test-room',
        role: 'host',
        participantId: 'test-user',
        timestamp: Date.now()
      };

      // Send JSON header first, then binary data
      ws.send(JSON.stringify(chunkMessage));
      
      // Generate and send mock audio data
      const mockAudio = generateMockPCM16(250); // 250ms chunk
      ws.send(mockAudio);

      chunkCount++;
      console.log(`📊 Sent audio chunk ${chunkCount}/${maxChunks} (${mockAudio.length} bytes)`);
    }, 250); // Send every 250ms
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Received transcript:', {
        type: message.type,
        text: message.text?.slice(0, 50) + (message.text?.length > 50 ? '...' : ''),
        timestamp: new Date(message.timestamp).toLocaleTimeString()
      });
    } catch (error) {
      console.log('📥 Received binary data:', data.length, 'bytes');
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`🔚 WebSocket closed: ${code} - ${reason || 'No reason'}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
}

// Run the test
if (require.main === module) {
  testASRConnection();
}

module.exports = { testASRConnection };