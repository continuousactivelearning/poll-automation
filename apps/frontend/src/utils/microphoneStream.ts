// apps/frontend/src/utils/microphoneStream.ts
// Use the shared TranscriptionResult type for consistency
import type { TranscriptionResult, StartMessage, EndMessage } from '../../../../shared/types/src/websocket.js'; // Ensure StartMessage and EndMessage are imported

const WS_URL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:3000";
const TARGET_SAMPLE_RATE = 16000; // Target sample rate for Whisper model
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096; // Buffer size in SAMPLES for ScriptProcessorNode (2^n, e.g., 2048, 4096, 8192, 16384)

export class MicrophoneStreamer {
    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null; // Deprecated but widely supported
    private stream: MediaStream | null = null;

    private reconnectTimeout: number | null = null;
    private pingInterval: number | null = null; // For frontend pings
    private stoppingManually: boolean = false; // Flag to differentiate between intentional and unintentional closes

    private meetingId: string;
    private speaker: string;
    private onTranscription: (data: TranscriptionResult) => void;
    private onStreamEnd: () => void;
    private onError: (error: Error | Event | unknown) => void;

    private recording: boolean = false;

    constructor(
        meetingId: string,
        speaker: string,
        onTranscription: (data: TranscriptionResult) => void,
        onStreamEnd: () => void,
        onError: (error: Error | Event | unknown) => void
    ) {
        this.meetingId = meetingId;
        this.speaker = speaker;
        this.onTranscription = onTranscription;
        this.onStreamEnd = onStreamEnd;
        this.onError = onError;
    }

    public async startStreaming(): Promise<void> {
        if (this.recording) {
            console.warn("[Frontend] Already recording.");
            return;
        }

        console.log("[Frontend] Initiating microphone streaming connection...");
        // Start the WebSocket connection attempt. Audio will start on WS open.
        this.attemptConnectWebSocket();
    }

    // New method to handle WebSocket connection and reconnection logic
    private attemptConnectWebSocket = (): void => {
        // Clear any pending reconnection timeout to avoid multiple attempts
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Clean up existing socket if it's not truly closed before attempting a new one
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            // Close existing gracefully, using 1000 for normal closure to not trigger auto-reconnect
            this.socket.close(1000, 'Attempting reconnection');
        }

        this.socket = new WebSocket(WS_URL);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = async () => {
            console.log("[Frontend WS] Connected to backend.");
            // Send initial metadata as a StartMessage
            const startMessage: StartMessage = { type: "start", meetingId: this.meetingId, speaker: this.speaker };
            this.socket?.send(JSON.stringify(startMessage));
            this.recording = true; // Mark as recording once WS is open

            // --- START Frontend Ping (Heartbeat) ---
            if (this.pingInterval) clearInterval(this.pingInterval); // Clear any old interval
            this.pingInterval = setInterval(() => {
                if (this.socket?.readyState === WebSocket.OPEN) {
                    // Send an application-level ping message
                    this.socket.send(JSON.stringify({ type: "ping" }));
                }
            }, 25000); // Send ping every 25 seconds (should be less than server's timeout)
            // --- END Frontend Ping ---

            // Initialize and connect audio stream ONLY after WebSocket is open
            try {
                await this.initAudioStream();
                this.mediaStreamSource?.connect(this.scriptProcessor!);
                this.scriptProcessor?.connect(this.audioContext!.destination);
                console.log("[Frontend] Microphone audio processing started.");
            } catch (err) {
                console.error("[Frontend] Error initializing audio stream after WS open:", err);
                this.onError(err);
                this.stopStreaming(false); // Stop if audio stream fails
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);
                if (data.type === "transcription") {
                    this.onTranscription(data as TranscriptionResult); // Pass transcription to callback
                    if (data.is_final) {
                        console.log("[Frontend WS] Received final transcription. Signalling stream end.");
                        // Important: Close socket with code 1000 (Normal Closure)
                        // This prevents the onclose handler from triggering auto-reconnect for this intentional stop.
                        if (this.socket?.readyState === WebSocket.OPEN) {
                            this.socket.close(1000, "Received final transcription");
                        }
                        this.stopStreaming(false); // Clean up audio stream, but don't send 'end' signal again
                    }
                } else if (data.type === "pong") {
                    // console.log("[Frontend WS] Received pong from backend."); // Optional: log backend pong
                }
                // Handle other message types like 'status', 'error' from backend here
            } catch (err) {
                console.error("[Frontend WS] Failed to parse message:", event.data, err);
                this.onError(err);
            }
        };

        this.socket.onclose = (event) => {
            console.log(`[Frontend WS] Disconnected from backend. Code: ${event.code}, Reason: ${event.reason}`);
            this.recording = false; // Stop internal recording flag
            if (this.pingInterval) clearInterval(this.pingInterval); // Clear frontend ping interval

            // Always disconnect audio stream on WS close
            this.disconnectAudioStream();

            // Attempt to reconnect only if it's not a normal, intentional closure (code 1000)
            // or if it wasn't triggered by stopStreaming (which sets stoppingManually)
            if (event.code !== 1000 && !this.stoppingManually) {
                console.log("[Frontend WS] Auto-reconnecting in 3 seconds...");
                // Set a timeout to attempt reconnection
                this.reconnectTimeout = setTimeout(this.attemptConnectWebSocket, 3000);
            } else {
                // If it was a normal closure or manual stop, signal end of stream
                this.onStreamEnd();
            }
        };

        this.socket.onerror = (err) => {
            console.error("[Frontend WS] WebSocket error:", err);
            this.onError(err);
            // WebSocket errors typically lead to 'onclose', which will then handle reconnection
            if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
                this.socket.close(); // Force close to ensure onclose is triggered
            }
        };
    }

    // New helper method to initialize audio stream components
    private async initAudioStream(): Promise<void> {
        // Only get media stream once unless explicitly reset
        if (!this.stream || !this.stream.active) {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);
        // ScriptProcessorNode should use AudioContext's sampleRate.
        this.scriptProcessor = this.audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
        this.scriptProcessor.onaudioprocess = this.handleAudioProcess;
    }

    // New helper method to disconnect and clean up audio stream resources
    private disconnectAudioStream(): void {
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor.onaudioprocess = null; // Remove event listener
            this.scriptProcessor = null;
        }
        if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
            this.mediaStreamSource = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop()); // Stop microphone tracks
            this.stream = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            // It's generally better to close the AudioContext to release system resources fully
            this.audioContext.close();
            this.audioContext = null;
        }
        console.log("[Frontend] Audio stream disconnected and resources released.");
    }

    public stopStreaming(sendEndSignal: boolean = true): void {
        if (!this.recording && !this.socket) { // No active recording or socket to stop
            console.warn("[Frontend] Streaming already stopped or not active.");
            return;
        }

        this.stoppingManually = true; // Set flag to indicate intentional stop
        this.recording = false;

        console.log("[Frontend] Stopping microphone streaming.");

        // Clean up audio stream resources immediately
        this.disconnectAudioStream();

        // Clear frontend ping interval if active
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            if (sendEndSignal) {
                console.log("[Frontend WS] Sending 'end' signal.");
                const endMessage: EndMessage = { type: "end", meetingId: this.meetingId, speaker: this.speaker };
                this.socket.send(JSON.stringify(endMessage));
            }
            // IMPORTANT: Close the socket with code 1000 (Normal Closure).
            // This prevents the `onclose` handler from triggering the auto-reconnect logic.
            this.socket.close(1000, 'Manual stop by user');
        } else {
            console.log("[Frontend] Socket not open or already closed. Signalling stream end.");
            this.onStreamEnd(); // Socket already closed or not open, just resolve
        }

        // Reset flag after potential close, allowing future auto-reconnects
        this.stoppingManually = false;
        this.socket = null; // Clear socket reference
    }

    private handleAudioProcess = (event: AudioProcessingEvent) => {
        if (!this.recording || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const inputBuffer = event.inputBuffer.getChannelData(0);

        if (this.audioContext && this.audioContext.sampleRate !== TARGET_SAMPLE_RATE) {
            // ** IMPORTANT: Implement actual resampling here if needed. **
            // The current code only warns and proceeds without resampling.
            // For proper Whisper performance, audio MUST be 16kHz.
            console.warn(
                `[Frontend WS] AudioContext sample rate (${this.audioContext.sampleRate}) does not match ` +
                `target sample rate (${TARGET_SAMPLE_RATE}). Resampling is required for optimal performance. ` +
                `Current implementation does NOT resample.`
            );
            // Example for resampling (requires a library or custom implementation):
            // const resampledBuffer = resampleAudio(inputBuffer, this.audioContext.sampleRate, TARGET_SAMPLE_RATE);
            // inputBuffer = resampledBuffer; // Use the resampled buffer
        }

        // Convert float32 audio to 16-bit PCM (signed 16-bit integers)
        const output = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
            const s = Math.max(-1, Math.min(1, inputBuffer[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; // Convert to signed 16-bit integer
        }

        // Send as ArrayBuffer (binary)
        this.socket.send(output.buffer);
    };
}