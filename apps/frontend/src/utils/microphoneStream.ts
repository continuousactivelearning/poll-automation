// apps/frontend/src/utils/microphoneStream.ts
import { createGainNode } from "../utils/volumeControl";

type MicConfig = {
  deviceId?: string;
  volume?: number; // 0.0 to 1.0
};
// Use the shared TranscriptionResult type for consistency
import type {
  TranscriptionResult,
  StartMessage,
  EndMessage,
} from "../../../../shared/types/src/websocket.js"; // Ensure StartMessage and EndMessage are imported

const WS_URL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:3000";
const TARGET_SAMPLE_RATE = 16000; // Target sample rate for Whisper model
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096; // Buffer size in SAMPLES for ScriptProcessorNode (2^n, e.g., 2048, 4096, 8192, 16384)

export class MicrophoneStreamer {
  private deviceId: string | undefined;
  private volume: number = 1;
  private config: MicConfig = {};
  private gainNode: GainNode | null = null;
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null; // Deprecated but widely supported
  private stream: MediaStream | null = null;

  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null; // For frontend pings
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
    onError: (error: Error | Event | unknown) => void,
    config?: { deviceId?: string; volume?: number } // ← Add this
  ) {
    this.meetingId = meetingId;
    this.speaker = speaker;
    this.onTranscription = onTranscription;
    this.onStreamEnd = onStreamEnd;
    this.onError = onError;

    // Default config if provided
    if (config?.deviceId) this.deviceId = config.deviceId;
    if (config?.volume !== undefined) this.volume = config.volume;
  }

    public setMicConfig(config: { deviceId?: string; volume?: number }) {
    if (config.deviceId !== undefined) {
      this.deviceId = config.deviceId;
      console.log("[MicConfig] Updated deviceId:", this.deviceId);
    }
    if (config.volume !== undefined) {
      this.volume = config.volume;
      console.log("[MicConfig] Updated volume:", this.volume);
    }
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
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      // Close existing gracefully, using 1000 for normal closure to not trigger auto-reconnect
      this.socket.close(1000, "Attempting reconnection");
    }

    this.socket = new WebSocket(WS_URL);
    this.socket.binaryType = "arraybuffer";

    this.socket.onopen = async () => {
      console.log("[Frontend WS] Connected to backend.");
      // Send initial metadata as a StartMessage
      const startMessage: StartMessage = {
        type: "start",
        meetingId: this.meetingId,
        speaker: this.speaker,
      };
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

        this.scriptProcessor?.connect(this.audioContext!.destination);
        console.log("[Frontend] Microphone audio processing started.");
      } catch (err) {
        console.error(
          "[Frontend] Error initializing audio stream after WS open:",
          err
        );
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
            console.log(
              "[Frontend WS] Received final transcription. Signalling stream end."
            );
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
        console.error(
          "[Frontend WS] Failed to parse message:",
          event.data,
          err
        );
        this.onError(err);
      }
    };

    this.socket.onclose = (event) => {
      console.log(
        `[Frontend WS] Disconnected from backend. Code: ${event.code}, Reason: ${event.reason}`
      );
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
  };

  // New helper method to initialize audio stream components
private async initAudioStream(): Promise<void> {
  // 1. Request audio stream from selected device
  const constraints: MediaStreamConstraints = {
    audio: this.deviceId ? { deviceId: { exact: this.deviceId } } : true,
  };

  this.stream = await navigator.mediaDevices.getUserMedia(constraints);

  // 2. Create (or resume) AudioContext
  if (!this.audioContext || this.audioContext.state === 'closed') {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  if (this.audioContext.state === 'suspended') {
    await this.audioContext.resume();
  }

  // 3. Create source from stream
  this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);

  // 4. Apply volume control using GainNode
  const gainNode = this.audioContext.createGain();
  gainNode.gain.value = this.volume; // default = 1

  // 5. Create script processor
  this.scriptProcessor = this.audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
  this.scriptProcessor.onaudioprocess = this.handleAudioProcess;

  // 6. Connect nodes: mic → gain → processor → output
  this.mediaStreamSource.connect(gainNode);
  gainNode.connect(this.scriptProcessor);
  this.scriptProcessor.connect(this.audioContext.destination);

  console.log("[Frontend] Audio stream initialized with deviceId:", this.deviceId, "volume:", this.volume);
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
      this.stream.getTracks().forEach((track) => track.stop()); // Stop microphone tracks
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      // It's generally better to close the AudioContext to release system resources fully
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log("[Frontend] Audio stream disconnected and resources released.");
  }

  public stopStreaming(sendEndSignal: boolean = true): void {
    if (!this.recording && !this.socket) {
      // No active recording or socket to stop
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
        const endMessage: EndMessage = {
          type: "end",
          meetingId: this.meetingId,
          speaker: this.speaker,
        };
        this.socket.send(JSON.stringify(endMessage));
      }
      // IMPORTANT: Close the socket with code 1000 (Normal Closure).
      // This prevents the `onclose` handler from triggering the auto-reconnect logic.
      this.socket.close(1000, "Manual stop by user");
    } else {
      console.log(
        "[Frontend] Socket not open or already closed. Signalling stream end."
      );
      this.onStreamEnd(); // Socket already closed or not open, just resolve
    }

    // Reset flag after potential close, allowing future auto-reconnects
    this.stoppingManually = false;
    this.socket = null; // Clear socket reference
  }

  private handleAudioProcess = async (event: AudioProcessingEvent) => {
    if (
      !this.recording ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    let inputBuffer = event.inputBuffer.getChannelData(0);

    // Resample if needed
    if (
      this.audioContext &&
      this.audioContext.sampleRate !== TARGET_SAMPLE_RATE
    ) {
      inputBuffer = await resampleBuffer(
        inputBuffer,
        this.audioContext.sampleRate,
        TARGET_SAMPLE_RATE
      );
    }

    // Convert float32 audio to 16-bit PCM (signed 16-bit integers)
    const output = new Int16Array(inputBuffer.length);
    for (let i = 0; i < inputBuffer.length; i++) {
      const s = Math.max(-1, Math.min(1, inputBuffer[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Skip silent buffers
    const avg =
      inputBuffer.reduce((sum, v) => sum + Math.abs(v), 0) / inputBuffer.length;
    if (avg < 0.01) return; // Skip silent buffers

    this.socket.send(output.buffer);
  };
}

// Add this helper function in your file (outside the class)
async function resampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number
): Promise<Float32Array> {
  if (inputSampleRate === targetSampleRate) return buffer;
  const offlineCtx = new OfflineAudioContext(
    1,
    (buffer.length * targetSampleRate) / inputSampleRate,
    targetSampleRate
  );
  const audioBuffer = offlineCtx.createBuffer(
    1,
    buffer.length,
    inputSampleRate
  );
  audioBuffer.copyToChannel(buffer, 0);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}
