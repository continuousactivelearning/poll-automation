// apps/frontend/src/utils/uploadAndStream.ts (Adjusted for explicit 'end' signal and final message handling)
const WS_URL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:3000";

const CHUNK_SIZE = 4096; // Define your desired chunk size (e.g., 4KB)

export async function uploadAndStreamWAV(file: File, meetingId: string, speaker: string) {
    return new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(WS_URL);
        socket.binaryType = "arraybuffer"; // Ensure binary data is handled as ArrayBuffer

        socket.onopen = () => {
            console.log("[Frontend→Backend WS] Connected to backend.");

            // 1. Send the initial "start" message with metadata
            const metadata = { type: "start", meetingId, speaker };
            console.log("[Frontend→Backend WS] Sending metadata:", metadata);
            socket.send(JSON.stringify(metadata));

            // 2. Read the file in chunks using a FileReader
            const reader = new FileReader();
            let offset = 0;

            reader.onload = (e) => {
                const chunk = e.target?.result as ArrayBuffer;
                if (socket.readyState === WebSocket.OPEN) {
                    // console.log(`[Frontend→Backend WS] Sending audio chunk: ${chunk.byteLength} bytes (Offset: ${offset})`);
                    socket.send(chunk); // Send each chunk as binary
                }

                offset += chunk.byteLength;
                if (offset < file.size) {
                    readNextChunk(); // Read the next chunk
                } else {
                    console.log("[Frontend→Backend WS] Finished sending audio file chunks.");
                    // --- NEW: Send an explicit 'end' signal ---
                    socket.send(JSON.stringify({ type: "end", meetingId, speaker }));
                    // Do NOT close the socket here. Wait for the backend to send final results.
                }
            };

            reader.onerror = (err) => {
                console.error("[Frontend→Backend WS] FileReader error:", err);
                socket.close(); // Close on reader error
                reject(err);
            };

            const readNextChunk = () => {
                const slice = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsArrayBuffer(slice);
            };

            readNextChunk(); // Start reading the first chunk
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);
                console.log("[Frontend→Backend WS] Received transcription:", data);
                // You can update your UI with `data.text` as partial transcriptions
                
                if (data.is_final) {
                    console.log("[Frontend→Backend WS] Received final transcription for stream. Closing socket.");
                    socket.close(); // Close after receiving the final results from the backend
                }
            } catch (err) {
                console.error("[Frontend→Backend WS] Failed to parse message:", event.data, err);
            }
        };

        socket.onclose = () => {
            console.log("[Frontend→Backend WS] Disconnected from backend.");
            resolve(); // Resolve the promise when the socket closes
        };

        socket.onerror = (err) => {
            console.error("[Frontend→Backend WS] WebSocket error:", err);
            socket.close();
            reject(err);
        };
    });
}