Overall Architecture & Flow
The project poll-automation is structured as a monorepo, which is a good choice for managing related frontend, backend, and services (like whisper and pollgen-llm).

Communication Flow for Live Transcription:

Frontend (MicrophoneStreamer):

Initiates a WebSocket connection to the Node.js backend.
Requests microphone access.
Once connected to the backend WS, sends a start message (JSON) with meetingId and speaker metadata.
Starts an AudioContext and ScriptProcessorNode to capture raw audio.
Resamples audio to 16kHz if necessary.
Converts Float32 audio to Int16Array (PCM).
Filters out silent buffers.
Sends raw binary audio chunks (ArrayBuffer) to the Node.js backend via WebSocket.
Sends a ping message periodically to maintain the connection.
Handles onmessage for transcription results from the backend and onclose/onerror for connection management.
On manual stopStreaming or is_final transcription, sends an end message and closes the WebSocket.
Backend (Node.js ws server):

Listens for WebSocket connections from the frontend.
Manages a connectionStore (Map<WebSocket, SessionData>) to associate each client WebSocket with session metadata (meetingId, speaker) and its dedicated Whisper service WebSocket.
On client start message:
Extracts meetingId and speaker.
Calls forwardToWhisper to establish a new, persistent WebSocket connection to the Python Whisper service.
Stores this whisperWs in the connectionStore.
Forwards the start message to the Whisper service.
On client audio chunk (binary data):
Retrieves the associated whisperWs from connectionStore.
Forwards the raw audio Buffer directly to the Python Whisper service.
On client end message or close event:
Calls removeConnectionMeta which, in turn, calls closeWhisperConnection to send an end signal and close the dedicated Whisper service WebSocket.
Cleans up the entry in connectionStore.
On message from Whisper service:
Parses the JSON response (e.g., transcription, status).
Forwards the transcription result back to the corresponding frontend client.
(Implicitly) handles is_final messages, which currently lead to frontend closing the WS.
Whisper Service (Python FastAPI faster_whisper):

Listens for WebSocket connections from the Node.js backend.
Loads the faster_whisper model (configurable size, medium default, auto-detects cuda/cpu and float16/int8).
Maintains an in-memory audio_buffer for each session.
On start message: Initializes session metadata.
On binary audio data: Appends to the audio_buffer.
Background process_audio_stream task:
Periodically checks if audio_buffer is full enough (e.g., 2 seconds of audio) or if a shutdown_event is set.
Extracts accumulated audio, converts it to numpy.float32.
Calls model.transcribe for real-time transcription.
Puts transcription results into a transcript_queue.
On end signal or final processing, sets transcription_finished_event.
Background send_transcriptions task:
Pulls transcription results from the transcript_queue.
Sends JSON transcription messages back to the Node.js backend.
Monitors transcription_finished_event and websocket_closed_by_endpoint to gracefully shut down.
On end message or client WebSocket disconnect: Sets shutdown_event to signal the processing task to flush remaining audio.
Includes robust logging.