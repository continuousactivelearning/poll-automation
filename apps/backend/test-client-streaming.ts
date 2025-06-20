// apps/backend/test-client-streaming.ts
import WebSocket, { RawData } from 'ws'; // Import RawData for binary message type
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream'; // For file stream

// Define interfaces for messages for type safety
interface StartMessage {
    type: 'start';
    meetingId: string;
    speaker: string;
}

// Assuming TranscriptionResult structure based on your backend
interface TranscriptionResult {
    type: 'transcription';
    meetingId: string;
    speaker: string;
    text: string;
    language: string;
    is_final: boolean;
    // Add other properties if your backend sends them, e.g., segment_start, segment_end, words
}

// You might also receive other message types, e.g., status, pong
interface StatusMessage {
    type: 'status';
    message: string;
}

interface PongMessage {
    type: 'pong';
}

interface UnknownMessage {
    type: string;
    [key: string]: unknown;
}

type BackendMessage = TranscriptionResult | StatusMessage | PongMessage | UnknownMessage;


// --- Configuration ---
const BACKEND_URL: string = 'ws://localhost:3000';
const AUDIO_FILE_PATH: string = path.join(__dirname, 'test-audio.wav'); // __dirname works fine in Node.js TypeScript
const CHUNK_SIZE: number = 4096; // Adjust chunk size (e.g., 4KB)
const MEETING_ID: string = 'stream-meeting-456';
const SPEAKER_ID: string = 'client-speaker-007';
// -------------------

// 1. Check if the audio file exists
if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`\n[Test Client] ERROR: Audio file not found at ${AUDIO_FILE_PATH}`);
    console.error('Please make sure you have a "test-audio.wav" file in the apps/backend/ directory.\n');
    process.exit(1);
}

// 2. Create a new WebSocket connection to the backend
const ws: WebSocket = new WebSocket(BACKEND_URL); // Explicitly type ws
let fileStream: Readable | undefined; // fileStream can be undefined initially

// 3. Handle the 'open' event (connection established)
ws.on('open', () => {
    console.log(`[Test Client] Connected to backend at ${BACKEND_URL}`);

    // 1. Send the initial "start" message with metadata
    const startMessage: StartMessage = { // Type assertion for startMessage
        type: 'start',
        meetingId: MEETING_ID,
        speaker: SPEAKER_ID,
    };
    ws.send(JSON.stringify(startMessage));
    console.log('[Test Client] Sent "start" message:', startMessage);

    // 2. Read and stream the audio file in chunks
    fileStream = fs.createReadStream(AUDIO_FILE_PATH, { highWaterMark: CHUNK_SIZE });
    let totalBytesSent: number = 0;

    fileStream.on('data', (chunk: Buffer) => { // Type chunk as Buffer
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(chunk); // Send each chunk as binary
            totalBytesSent += chunk.length;
            process.stdout.write(`[Test Client] Sent chunk: ${chunk.length} bytes (Total: ${totalBytesSent} bytes)\r`);
        }
    });

    fileStream.on('end', () => {
        console.log(`\n[Test Client] Finished sending audio file. Total bytes: ${totalBytesSent}`);
        // Optionally send an "end" signal. In a real scenario, you'd send 'end'
        // when the user stops speaking or the recording finishes.
        // For this test client, it's often more practical to let the backend
        // infer end-of-stream from WebSocket close or an explicit 'end' message.
        // For explicit end signal:
        // ws.send(JSON.stringify({ type: 'end', meetingId: MEETING_ID }));
    });

    fileStream.on('error', (err: Error) => { // Type err as Error
        console.error('[Test Client] File stream error:', err);
        ws.close();
    });

    console.log('[Test Client] Waiting for transcription...');
});

// 4. Handle incoming messages from the backend
ws.on('message', (data: RawData) => { // Type data as RawData
    try {
        const response: BackendMessage = JSON.parse(data.toString()); // Type response with union type

        if (response.type === 'transcription') {
            console.log('\n--- PARTIAL TRANSCRIPTION RECEIVED ---');
            console.log(JSON.stringify(response, null, 2));
            console.log('-------------------------------------\n');
            // If you want to close after the *final* transcription:
            // if (response.is_final) {
            //     console.log('[Test Client] Received final transcription. Closing connection.');
            //     ws.close();
            // }
        } else if (response.type === 'status') {
            console.log(`[Test Client] Status: ${response.message}`);
        } else if (response.type === 'pong') {
            // This client does not send pings, so receiving a pong is unexpected but harmless,
            // likely from the backend's heartbeat.
            // console.log('[Test Client] Received pong from backend.');
        } else {
            console.log('[Test Client] Received unknown message type:', response.type, response);
        }

        // We will keep the connection open for continuous streaming until the file stream ends,
        // or a manual close is triggered, or the backend closes the connection.

    } catch (error: unknown) { // Catch-all for parsing errors
        console.error('[Test Client] Failed to parse response from backend:', error);
    }
});

// 5. Handle errors
ws.on('error', (error: Error) => { // Type error as Error
    console.error('[Test Client] WebSocket error:', error.message);
});

// 6. Handle the 'close' event
ws.on('close', () => {
    console.log('[Test Client] Disconnected from backend.');
    if (fileStream) {
        fileStream.destroy(); // Ensure file stream is closed if still active
    }
});

// Optional: To stop the client after some time (for testing continuous stream)
// This is useful if you want to test how the backend handles the client disconnecting mid-stream.
// setTimeout(() => {
//     console.log('[Test Client] Test complete after duration. Closing connection.');
//     ws.close();
// }, 60000); // Close after 60 seconds