// uploadAndStream.ts - Socket.IO audio upload utility
// Updated to work with our current Socket.IO backend on port 5003

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export async function uploadAndStreamWAV(file: File, meetingId: string, speaker: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log(`[Frontend→Backend Socket.IO] Connecting to: ${SOCKET_URL}`);

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', async () => {
      console.log("[Frontend→Backend Socket.IO] Connected to backend.");

      try {
        // Join the meeting room first
        socket.emit('join-meeting', meetingId);
        console.log(`[Frontend→Backend Socket.IO] Joined meeting: ${meetingId}`);

        // Start audio stream
        socket.emit('start-audio-stream', {
          meetingId,
          hostId: speaker,
          fileName: file.name,
          fileSize: file.size,
          timestamp: new Date().toISOString()
        });

        // Convert file to array buffer and send as chunks
        const arrayBuffer = await file.arrayBuffer();
        const chunkSize = 8192; // 8KB chunks
        const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

        console.log(`[Frontend→Backend Socket.IO] Sending ${totalChunks} chunks of ${chunkSize} bytes each...`);

        // Send file in chunks
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
          const chunk = arrayBuffer.slice(start, end);

          socket.emit('audio-chunk', {
            meetingId,
            audioChunk: Array.from(new Uint8Array(chunk)),
            chunkIndex: i,
            totalChunks,
            timestamp: new Date().toISOString(),
            isLast: i === totalChunks - 1
          });

          // Small delay between chunks to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Stop audio stream
        socket.emit('stop-audio-stream', {
          meetingId,
          hostId: speaker,
          timestamp: new Date().toISOString()
        });

        console.log("[Frontend→Backend Socket.IO] All chunks sent successfully");

        // Wait a bit for server processing, then resolve
        setTimeout(() => {
          socket.disconnect();
          resolve();
        }, 1000);

      } catch (error) {
        console.error("[Frontend→Backend Socket.IO] Error processing file:", error);
        socket.disconnect();
        reject(error);
      }
    });

    socket.on('connect_error', (error) => {
      console.error("[Frontend→Backend Socket.IO] Connection error:", error);
      reject(new Error("Socket.IO connection failed"));
    });

    socket.on('audio-stream-started', (data) => {
      console.log("[Frontend→Backend Socket.IO] Audio stream started:", data);
    });

    socket.on('audio-chunk-received', (data) => {
      console.log(`[Frontend→Backend Socket.IO] Chunk ${data.chunkIndex} received by server`);
    });

    socket.on('realtime-transcript-update', (data) => {
      console.log("[Frontend→Backend Socket.IO] Real-time transcript:", data.partialTranscript);
    });

    socket.on('realtime-poll-generated', (data) => {
      console.log("[Frontend→Backend Socket.IO] Real-time poll generated:", data.poll);
    });

    socket.on('audio-stream-stopped', (data) => {
      console.log("[Frontend→Backend Socket.IO] Audio stream stopped:", data);
    });

    // Set a timeout for the upload
    setTimeout(() => {
      if (socket.connected) {
        console.warn("[Frontend→Backend Socket.IO] Upload timeout, disconnecting");
        socket.disconnect();
        reject(new Error("Upload timeout"));
      }
    }, 60000); // 60 second timeout for larger files
  });
}

// Helper function to validate WAV file
export function validateWAVFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file selected" };
  }

  if (!file.name.toLowerCase().endsWith('.wav')) {
    return { isValid: false, error: "File must be a WAV file" };
  }

  if (file.size > 100 * 1024 * 1024) { // 100MB limit
    return { isValid: false, error: "File size must be less than 100MB" };
  }

  if (file.size < 1024) { // 1KB minimum
    return { isValid: false, error: "File is too small to be a valid audio file" };
  }

  return { isValid: true };
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
