// apps/frontend/src/utils/microphoneStream.ts
const WS_URL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:3000";
const SAMPLE_RATE = 16000; // Match backend's expected sample rate
const CHUNK_SIZE = 4096; // Bytes per audio chunk to send (adjust for desired network packet size)

interface TranscriptionResult {
    type: string;
    meetingId: string;
    speaker: string;
    text: string;
    segment_start: number;
    segment_end: number;
    language: string;
    is_final: boolean;
}

export class MicrophoneStreamer {
    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null; // Deprecated but widely supported
    private stream: MediaStream | null = null;

    private meetingId: string;
    private speaker: string;
    private onTranscription: (data: TranscriptionResult) => void;
    private onStreamEnd: () => void;
    private onError: (error: any) => void;

    private recording: boolean = false;

    constructor(
        meetingId: string,
        speaker: string,
        onTranscription: (data: TranscriptionResult) => void,
        onStreamEnd: () => void,
        onError: (error: any) => void
    ) {
        this.meetingId = meetingId;
        this.speaker = speaker;
        this.onTranscription = onTranscription;
        this.onStreamEnd = onStreamEnd;
        this.onError = onError;
    }

    public async startStreaming(): Promise<void> {
        if (this.recording) {
            console.warn("Already recording.");
            return;
        }

        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Check if AudioContext needs to be resumed for some browsers
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);

            // Create a ScriptProcessorNode to get audio buffers
            // Buffer size (2^n, e.g., 2048, 4096, 8192, 16384)
            // Input channels = 1 (mono), Output channels = 1 (mono)
            this.scriptProcessor = this.audioContext.createScriptProcessor(CHUNK_SIZE, 1, 1);
            this.scriptProcessor.onaudioprocess = this.handleAudioProcess;

            // Connect everything
            this.mediaStreamSource.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination); // Connect to speakers to hear yourself (optional)

            // Initialize WebSocket
            this.socket = new WebSocket(WS_URL);
            this.socket.binaryType = "arraybuffer";

            this.socket.onopen = () => {
                console.log("[Frontend WS] Connected to backend.");
                // Send initial metadata
                this.socket?.send(JSON.stringify({ type: "start", meetingId: this.meetingId, speaker: this.speaker }));
                this.recording = true;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data: TranscriptionResult = JSON.parse(event.data as string);
                    this.onTranscription(data); // Pass transcription to callback
                    if (data.is_final) {
                        console.log("[Frontend WS] Received final transcription. Signaling stream end.");
                        this.stopStreaming(true); // Stop streaming after final result
                    }
                } catch (err) {
                    console.error("[Frontend WS] Failed to parse message:", event.data, err);
                    this.onError(err);
                }
            };

            this.socket.onclose = () => {
                console.log("[Frontend WS] Disconnected from backend.");
                // onStreamEnd will be called by stopStreaming if not already.
                if (this.recording) { // If recording wasn't stopped cleanly
                    this.stopStreaming(false); // Clean up without sending 'end' again
                }
            };

            this.socket.onerror = (err) => {
                console.error("[Frontend WS] WebSocket error:", err);
                this.onError(err);
                this.stopStreaming(false); // Stop on error
            };

            console.log("[Frontend] Microphone streaming started.");

        } catch (err) {
            console.error("[Frontend] Error starting microphone stream:", err);
            this.onError(err);
        }
    }

    public stopStreaming(sendEndSignal: boolean = true): void {
    if (!this.recording) {
        return;
    }
    this.recording = false;

    console.log("[Frontend] Stopping microphone streaming.");


        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor.onaudioprocess = null;
        }
        if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close(); // Close the audio context
            this.audioContext = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop()); // Stop microphone tracks
            this.stream = null;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        if (sendEndSignal) {
            console.log("[Frontend WS] Sending 'end' signal.");
            this.socket.send(JSON.stringify({ type: "end", meetingId: this.meetingId, speaker: this.speaker }));
        }
            // Give backend a moment to process the 'end' signal and final audio
            // before closing the socket. The backend will send is_final: true.
            // We close the socket upon receiving is_final: true.
            // If the backend closes first, onclose will handle it.
        } else {
         this.onStreamEnd(); // Socket already closed or not open, just resolve
    }
    }

    private handleAudioProcess = (event: AudioProcessingEvent) => {
        if (!this.recording || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        // Get the audio data from the input buffer (mono)
        const inputBuffer = event.inputBuffer.getChannelData(0);

        // Convert float32 audio to 16-bit PCM (signed 16-bit integers)
        // Whisper expects 16kHz, 16-bit PCM. Browser's AudioContext might be different.
        // We need to resample if AudioContext.sampleRate !== 16000
        // For simplicity, this example assumes AudioContext.sampleRate is 16000 or handles it
        // Or you might need a resampling library like 'resampler' or manually resample.
        // For now, let's assume we can directly convert to 16-bit int and it's already 16kHz
        // It's crucial to ensure the SAMPLE_RATE matches between frontend and backend.
        const output = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
            let s = Math.max(-1, Math.min(1, inputBuffer[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; // Convert to signed 16-bit integer
        }

        // Send as ArrayBuffer (binary)
        this.socket.send(output.buffer);
    };
}