import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
const BACKEND_URL = 'ws://localhost:3000';
const AUDIO_FILE_PATH = path.join(__dirname, 'test-audio.wav'); // __dirname works in CommonJS
// -------------------

// 1. Check if the audio file exists
if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`\n[Test Client] ERROR: Audio file not found at ${AUDIO_FILE_PATH}`);
    console.error('Please make sure you have a "test-audio.wav" file in the apps/backend/ directory.\n');
    process.exit(1);
}

// 2. Create a new WebSocket connection to the backend
const ws = new WebSocket(BACKEND_URL);

// 3. Handle the 'open' event (connection established)
ws.on('open', () => {
    console.log(`[Test Client] Connected to backend at ${BACKEND_URL}`);

    // Define the session metadata
    const startMessage = {
        type: 'start',
        meetingId: 'test-meeting-123',
        speaker: 'test-speaker-01',
    };

    // Send the session metadata as a JSON string
    ws.send(JSON.stringify(startMessage));
    console.log('[Test Client] Sent "start" message:', startMessage);

    // Read the audio file into a buffer
    const audioBuffer = fs.readFileSync(AUDIO_FILE_PATH);

    // Send the audio buffer as binary data
    ws.send(audioBuffer);
    console.log(`[Test Client] Sent audio file (${audioBuffer.length} bytes)`);
    console.log('[Test Client] Waiting for transcription...');
});

// 4. Handle incoming messages from the backend
ws.on('message', (data) => {
    try {
        const response = JSON.parse(data.toString());
        console.log('\n--- TRANSCRIPTION RECEIVED ---');
        console.log(JSON.stringify(response, null, 2));
        console.log('------------------------------\n');
        console.log('[Test Client] Test successful! Closing connection.');
        ws.close(); // Close the connection after receiving the result
    } catch (error) {
        console.error('[Test Client] Failed to parse response from backend:', error);
    }
});

// 5. Handle errors
ws.on('error', (error) => {
    console.error('[Test Client] WebSocket error:', error.message);
});

// 6. Handle the 'close' event
ws.on('close', () => {
    console.log('[Test Client] Disconnected from backend.');
});
