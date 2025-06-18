/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
// apps/backend/test-client-streaming.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// --- Configuration ---
const BACKEND_URL = 'ws://localhost:3000';
const AUDIO_FILE_PATH = path.join(__dirname, 'test-audio.wav'); // Your large audio file
const CHUNK_SIZE = 4096; // Adjust chunk size (e.g., 4KB)
const MEETING_ID = 'stream-meeting-456';
const SPEAKER_ID = 'client-speaker-007';
// -------------------

if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`\n[Test Client] ERROR: Audio file not found at ${AUDIO_FILE_PATH}`);
    console.error('Please make sure you have a "test-audio.wav" file in the apps/backend/ directory.\n');
    process.exit(1);
}

const ws = new WebSocket(BACKEND_URL);
let fileStream;

ws.on('open', () => {
    console.log(`[Test Client] Connected to backend at ${BACKEND_URL}`);

    // 1. Send the initial "start" message with metadata
    const startMessage = {
        type: 'start',
        meetingId: MEETING_ID,
        speaker: SPEAKER_ID,
    };
    ws.send(JSON.stringify(startMessage));
    console.log('[Test Client] Sent "start" message:', startMessage);

    // 2. Read and stream the audio file in chunks
    fileStream = fs.createReadStream(AUDIO_FILE_PATH, { highWaterMark: CHUNK_SIZE });
    let totalBytesSent = 0;

    fileStream.on('data', (chunk) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(chunk); // Send each chunk as binary
            totalBytesSent += chunk.length;
            process.stdout.write(`[Test Client] Sent chunk: ${chunk.length} bytes (Total: ${totalBytesSent} bytes)\r`);
        }
    });

    fileStream.on('end', () => {
        console.log(`\n[Test Client] Finished sending audio file. Total bytes: ${totalBytesSent}`);
        // Optionally send an "end" signal, though not strictly necessary if connection closes naturally
        // ws.send(JSON.stringify({ type: 'end', meetingId: MEETING_ID }));
    });

    fileStream.on('error', (err) => {
        console.error('[Test Client] File stream error:', err);
        ws.close();
    });

    console.log('[Test Client] Waiting for transcription...');
});

ws.on('message', (data) => {
    try {
        const response = JSON.parse(data.toString());
        console.log('\n--- PARTIAL TRANSCRIPTION RECEIVED ---');
        console.log(JSON.stringify(response, null, 2));
        console.log('-------------------------------------\n');
        // We will keep the connection open for continuous streaming, 
        // the client will only close when the file stream ends or manually.
    } catch (error) {
        console.error('[Test Client] Failed to parse response from backend:', error);
    }
});

ws.on('error', (error) => {
    console.error('[Test Client] WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('[Test Client] Disconnected from backend.');
    if (fileStream) {
        fileStream.destroy(); // Ensure file stream is closed
    }
});

// To stop the client after some time (for testing continuous stream)
// setTimeout(() => {
//     console.log('[Test Client] Test complete after duration. Closing connection.');
//     ws.close();
// }, 60000); // Close after 60 seconds