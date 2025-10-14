import asyncio
import json
import uuid
import numpy as np
import io
import os
import logging
from typing import Dict, Any, Union

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel
from dotenv import load_dotenv

# --- 1. Configuration Constants (Moved to config.py for better organization) ---
# Load environment variables (e.g., from .env file)
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- 2. Model Loading ---
# Determine device (CPU or CUDA)
try:
    import torch
    # Prioritize CUDA if available, otherwise use CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cuda":
        # For GPUs, float16 offers the best performance with minimal accuracy loss
        compute_type = "float16"
        logger.info(f"[Whisper Service] PyTorch CUDA is available. Using device='cuda' with compute_type='float16'.")
    else:
        # For CPUs, int8 quantization is crucial for performance
        compute_type = "int8"
        logger.info(f"[Whisper Service] PyTorch CUDA not available. Using device='cpu' with compute_type='int8'.")
except ImportError:
    # Fallback if torch is not installed at all
    device = "cpu"
    compute_type = "int8"
    logger.warning("[WARNING] PyTorch not installed. Defaulting to device='cpu' with compute_type='int8'. "
                    "Install PyTorch for potential CUDA acceleration.")
except Exception as e:
    # Catch any other import/initialization errors for torch
    device = "cpu"
    compute_type = "int8"
    logger.error(f"[ERROR] Failed to initialize PyTorch/CUDA: {e}. Defaulting to device='cpu' with compute_type='int8'.")


# Configure Whisper model size
# User requested "medium" model for good results without being "too much"
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "medium") # Default to medium
try:
    model = WhisperModel(WHISPER_MODEL_SIZE, device=device, compute_type=compute_type)
    logger.info(f"[Whisper Service] Model '{WHISPER_MODEL_SIZE}' loaded on {device} with {compute_type}.")
except Exception as e:
    logger.critical(f"[Whisper Service] Failed to load Whisper model '{WHISPER_MODEL_SIZE}': {e}. "
                     "Ensure the model name is correct and necessary files are downloaded. Exiting.")
    exit(1) # Critical error, cannot proceed without model


# --- 3. Audio Processing Constants ---
SAMPLE_RATE = 16000 # Standard for Whisper models
BYTES_PER_SAMPLE = 2 # 16-bit audio (e.g., from browser's Int16Array)

# BUFFER_DURATION_SECONDS: Crucial for real-time responsiveness vs. context
# For live teaching, 1.5-2.5 seconds is ideal for low latency. Let's start with 2.0.
# Made configurable via environment variable for easy tuning in different deployments.
BUFFER_DURATION_SECONDS = float(os.getenv("BUFFER_DURATION_SECONDS", 2.0))
BUFFER_SIZE_BYTES = int(BUFFER_DURATION_SECONDS * SAMPLE_RATE * BYTES_PER_SAMPLE)

# --- 4. FastAPI Application Setup ---
app = FastAPI()

# Global store for active WebSocket sessions
connected_sessions: Dict[str, Dict[str, Any]] = {}

# --- 5. Asynchronous Tasks ---

# Task 1: Processes audio from buffer and pushes transcriptions to queue
async def process_audio_stream(session_data: Dict[str, Any]):
    session_id = session_data["session_id"]
    audio_buffer: io.BytesIO = session_data["audio_buffer"]
    transcript_queue: asyncio.Queue = session_data["transcript_queue"]
    shutdown_event: asyncio.Event = session_data["shutdown_event"]
    transcription_finished_event: asyncio.Event = session_data["transcription_finished_event"] # Added
    last_text_sent = "" # To help reduce redundant transmissions of identical final segments

    logger.info(f"[{session_id}] Processing task started.") # Granular log
    try:
        while True:
            # Sleep briefly to yield control and prevent busy-waiting
            await asyncio.sleep(0.05)
            logger.debug(f"[{session_id}] Processing task: Checking buffer.") # Granular log

            current_buffer_length = audio_buffer.tell()

            # Trigger transcription if buffer is full enough OR if shutdown is signaled AND there's audio
            if current_buffer_length >= BUFFER_SIZE_BYTES or \
               (shutdown_event.is_set() and current_buffer_length > 0):

                # If buffer is empty after check (e.g., just processed last bit), wait for more or shutdown
                if current_buffer_length == 0:
                    logger.debug(f"[{session_id}] Processing task: Buffer empty, continuing loop.") # Granular log
                    continue

                # Read accumulated audio bytes
                audio_buffer.seek(0)
                audio_bytes = audio_buffer.read(current_buffer_length)
                audio_buffer.seek(0) # Reset buffer pointer
                audio_buffer.truncate(0) # Clear the buffer completely

                if not audio_bytes: # Should not happen if current_buffer_length > 0, but good safeguard
                    logger.warning(f"[{session_id}] Processing task: Read 0 bytes despite positive buffer length. Skipping.") # Granular log
                    continue

                audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

                logger.info(f"[{session_id}] Transcribing {audio_np.shape[0] / SAMPLE_RATE:.2f} seconds of audio.")

                try:
                    # `beam_size=5` (default) is a good balance for accuracy, given resources are not an issue.
                    # `condition_on_previous_text=False` is important for real-time chunking to avoid repetition.
                    segments_generator, info = model.transcribe(
                        audio_np,
                        beam_size=5,
                        word_timestamps=True, # Useful for more detailed future features
                        language="en", # Auto-detect language
                        condition_on_previous_text=False,
                    )

                    transcribed_text_parts = []
                    # Consume the generator fully
                    for segment in segments_generator:
                        transcribed_text_parts.append(segment.text)

                    transcribed_text = " ".join(transcribed_text_parts).strip()

                    # Only send if new transcription is available and different from last
                    if transcribed_text and transcribed_text != last_text_sent:
                        result = {
                            "type": "transcription",
                            "meetingId": session_data["meeting_id"],
                            "speaker": session_data["speaker"],
                            "text": transcribed_text,
                            # For simplicity in this real-time stream, segment_start/end are less critical
                            # as we're sending continuous chunks. Keep them if they serve a frontend purpose.
                            # You might want to calculate these relative to the start of the entire session.
                            "language": info.language if info and info.language else "unknown",
                            "is_final": False # Not necessarily final for continuous chunks
                        }
                        await transcript_queue.put(result)
                        last_text_sent = transcribed_text
                        logger.debug(f"[{session_id}] Put transcription in queue: {transcribed_text[:70]}...") # Granular log
                    else:
                        logger.debug(f"[{session_id}] No new speech or identical transcription in chunk.") # Granular log

                except Exception as e:
                    logger.error(f"[{session_id}] Error during transcription: {e}", exc_info=True)
                    await transcript_queue.put({"type": "error", "message": str(e), "is_final": True})

            # Exit condition for the processing task: shutdown signaled AND buffer is empty
            if shutdown_event.is_set() and audio_buffer.tell() == 0:
                logger.info(f"[{session_id}] Processing task: Shutdown signaled and buffer empty. Exiting.") # Granular log
                break

    except asyncio.CancelledError:
        logger.info(f"[{session_id}] Processing task cancelled.") # Granular log
    except Exception as e:
        logger.error(f"[{session_id}] Unhandled error in processing task: {e}", exc_info=True)
        # Attempt to signal sender task about the error
        await transcript_queue.put({"type": "error", "message": "Internal processing error", "is_final": True})
    finally:
        # Signal that this task has finished putting all its results into the queue
        transcription_finished_event.set()
        logger.info(f"[{session_id}] Processing task finished. Transcription_finished_event set.") # Granular log


# Task 2: Sends transcriptions from queue to WebSocket client
async def send_transcriptions(session_data: Dict[str, Any]):
    session_id = session_data["session_id"]
    websocket: WebSocket = session_data["websocket"]
    transcript_queue: asyncio.Queue = session_data["transcript_queue"]
    websocket_closed_by_endpoint: asyncio.Event = session_data["websocket_closed_by_endpoint"] # Added
    transcription_finished_event: asyncio.Event = session_data["transcription_finished_event"] # Added

    logger.info(f"[{session_id}] Transcription sender task started.") # Granular log
    try:
        while True:
            # Priority check: Has the main websocket_endpoint signaled its shutdown?
            # If so, it's handling the final cleanup and we should stop trying to send.
            if websocket_closed_by_endpoint.is_set():
                logger.info(f"[{session_id}] Sender task: Main endpoint signaled closure. Exiting send loop.") # Granular log
                break

            try:
                # Wait for results from the queue with a timeout.
                # This allows us to periodically check for `websocket_closed_by_endpoint`.
                result = await asyncio.wait_for(transcript_queue.get(), timeout=0.5)

                # Attempt to send the result.
                # Crucial: Catch `RuntimeError` which indicates the connection is already closed by client/server.
                await websocket.send_json(result)
                logger.debug(f"[{session_id}] Sent transcription: {result.get('text', 'N/A')[:50]}...") # Granular log

                # If it was a final message and processing is also confirmed finished, then exit.
                # This helps ensure all final messages are sent.
                if result.get("is_final") and transcription_finished_event.is_set() and transcript_queue.empty():
                    logger.info(f"[{session_id}] Sender task: Final message sent and all processing complete. Exiting.") # Granular log
                    break

            except asyncio.TimeoutError:
                # Queue empty for now. Check if processing is finished and no more expected.
                if transcription_finished_event.is_set() and transcript_queue.empty():
                    logger.info(f"[{session_id}] Sender task: Queue empty and processing finished. Exiting.") # Granular log
                    break
                else:
                    logger.debug(f"[{session_id}] Sender task: Timeout, waiting for more data or shutdown.") # Granular log
                continue # Continue waiting for more messages

            except RuntimeError as e:
                # This is the most common error when the client's WebSocket closes first.
                logger.error(f"[{session_id}] Sender task: WebSocket connection likely closed. Error: {e}") # Granular log
                break # Stop trying to send
            except Exception as e:
                logger.error(f"[{session_id}] Sender task: Unexpected error during send: {e}", exc_info=True) # Granular log
                break # Stop on unexpected errors

    except asyncio.CancelledError:
        logger.info(f"[{session_id}] Sender task cancelled.") # Granular log
    except Exception as e:
        logger.error(f"[{session_id}] Sender task: Unhandled error: {e}", exc_info=True) # Granular log
    finally:
        logger.info(f"[{session_id}] Transcription sender task finished.") # Granular log


# --- 6. FastAPI WebSocket Endpoint ---
@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    session_id = str(uuid.uuid4())
    session_data = {
        "session_id": session_id, # Added for consistent logging
        "websocket": websocket,
        "meeting_id": "N/A", # Default, will be updated by 'start' message
        "speaker": "N/A",    # Default, will be updated by 'start' message
        "audio_buffer": io.BytesIO(),
        "transcript_queue": asyncio.Queue(),
        "processing_task": None,
        "shutdown_event": asyncio.Event(), # Signals processing task to stop accumulating
        "transcription_finished_event": asyncio.Event(), # Signals processing task has put all results in queue
        "websocket_closed_by_endpoint": asyncio.Event(), # Signals this endpoint is cleaning up its WS
    }
    connected_sessions[session_id] = session_data

    logger.info(f"[{session_id}] NEW SESSION: Client connected and WebSocket accepted.") # Granular log

    try:
        await websocket.accept()

        # Start background tasks
        sender_task = asyncio.create_task(send_transcriptions(session_data))
        session_data["processing_task"] = asyncio.create_task(
            process_audio_stream(session_data)
        )
        session_data["sender_task"] = sender_task # Store sender task reference for cleanup

        logger.info(f"[{session_id}] Session started. Entering receive loop.") # Granular log
        while True:
            try:
                # --- CRITICAL FIX: Correctly parse WebSocket message types from FastAPI ---
                message_received: Union[WebSocket.WebSocketMessage, Dict[str, Any]] = await websocket.receive()
                logger.debug(f"[{session_id}] Message received (type: {message_received.get('type')}).") # Granular log

                if message_received["type"] == "websocket.receive":
                    if "text" in message_received:
                        data = json.loads(message_received["text"])
                        if data.get("type") == "start":
                            session_data["meeting_id"] = data.get("meetingId", "N/A")
                            session_data["speaker"] = data.get("speaker", "N/A")
                            logger.info(f"[{session_id}] Received 'start' signal for meeting: {session_data['meeting_id']}, speaker: {session_data['speaker']}") # Granular log
                            await websocket.send_json({"type": "status", "message": "Whisper session started"})
                        elif data.get("type") == "end":
                            logger.info(f"[{session_id}] Received 'end' signal. Signaling shutdown.") # Granular log
                            session_data["shutdown_event"].set() # Signal processing task to wrap up
                            # Do NOT break here yet, allow last few audio chunks to come in and be processed,
                            # or wait for client to disconnect.
                        else:
                            logger.warning(f"[{session_id}] Unknown text message type received: {data.get('type')}") # Granular log

                    elif "bytes" in message_received:
                        audio_chunk = message_received["bytes"]
                        session_data["audio_buffer"].write(audio_chunk)
                        logger.debug(f"[{session_id}] Received audio chunk of {len(audio_chunk)} bytes. Buffer size: {session_data['audio_buffer'].tell()} bytes.") # Granular log
                    else:
                        logger.warning(f"[{session_id}] Received websocket.receive with no text or bytes payload.") # Granular log

                elif message_received["type"] == "websocket.disconnect":
                    logger.info(f"[{session_id}] Received websocket.disconnect message. Signaling shutdown.") # Granular log
                    session_data["shutdown_event"].set() # Signal shutdown for background tasks
                    break # IMPORTANT: Exit the receive loop immediately

                else: # This 'else' will now only catch truly unexpected ASGI message formats
                    logger.warning(f"[{session_id}] Unexpected ASGI message format: {message_received}") # Granular log

            except WebSocketDisconnect:
                logger.info(f"[{session_id}] Client disconnected (WebSocketDisconnect exception). Signaling shutdown.") # Granular log
                session_data["shutdown_event"].set() # Signal shutdown to processing task
                break # Exit the receive loop as client is gone
            except json.JSONDecodeError:
                logger.error(f"[{session_id}] Received invalid JSON text message.", exc_info=True)
            except Exception as e:
                logger.error(f"[{session_id}] Unexpected error during receive loop: {e}", exc_info=True)
                session_data["shutdown_event"].set() # Signal shutdown on unhandled error
                break # Exit loop on unhandled error

    finally:
        logger.info(f"[{session_id}] WebSocket endpoint entering finally block for cleanup.") # Granular log

        # Ensure shutdown signal is set, especially if loop broke prematurely
        if not session_data["shutdown_event"].is_set():
            session_data["shutdown_event"].set()
            logger.info(f"[{session_id}] Shutdown event forcefully set in finally block.") # Granular log

        # Wait for the processing task to finish and put all remaining results into the queue.
        # This is crucial for flushing last bits of audio.
        if session_data["processing_task"]:
            try:
                # Use a timeout to prevent indefinite hangs if processing task itself gets stuck
                # Timeout = (2x buffer duration to cover current buffer + next expected) + 5s buffer for processing
                await asyncio.wait_for(session_data["processing_task"], timeout=BUFFER_DURATION_SECONDS * 2 + 5)
                logger.info(f"[{session_id}] Processing task completed gracefully.") # Granular log
            except asyncio.TimeoutError:
                logger.warning(f"[{session_id}] Processing task did not finish in time during final await. It might be stuck. Cancelling.") # Granular log
                session_data["processing_task"].cancel()
                try:
                    await session_data["processing_task"] # Await cancellation to propagate
                except asyncio.CancelledError:
                    logger.info(f"[{session_id}] Processing task caught CancelledError during await.")
                except Exception as e:
                    logger.error(f"[{session_id}] Error during processing task cancellation await: {e}", exc_info=True)
            except asyncio.CancelledError:
                logger.info(f"[{session_id}] Processing task was already cancelled.") # Granular log
            except Exception as e:
                logger.error(f"[{session_id}] Error awaiting processing task: {e}", exc_info=True)

        # Wait for transcription_finished_event, ensuring processing is truly done
        # before telling sender to stop or for sender to finish.
        # Add a timeout here too as a safeguard.
        try:
            await asyncio.wait_for(session_data["transcription_finished_event"].wait(), timeout=5) # Short timeout, as processing_task should have finished
            logger.info(f"[{session_id}] All transcriptions processed and queued (transcription_finished_event set).") # Granular log
        except asyncio.TimeoutError:
            logger.warning(f"[{session_id}] transcription_finished_event not set in time. Some transcriptions might be lost.") # Granular log
        except asyncio.CancelledError:
            logger.info(f"[{session_id}] Waiting for transcription_finished_event was cancelled.") # Granular log
        except Exception as e:
            logger.error(f"[{session_id}] Error waiting for transcription_finished_event: {e}", exc_info=True)


        # Signal to the sender task that *this* endpoint is about to close the WebSocket.
        # This tells the sender task to gracefully stop trying to send messages.
        session_data["websocket_closed_by_endpoint"].set()
        logger.info(f"[{session_id}] Signaled sender task that websocket is closing.") # Granular log

        # Give the sender task a moment to acknowledge the closure signal and exit its loop
        await asyncio.sleep(0.1) # Small sleep to allow sender to react

        # Ensure the sender task is truly done (cancel if it's still running)
        if session_data["sender_task"] and not session_data["sender_task"].done(): # Check if task exists and is not done
            session_data["sender_task"].cancel()
            logger.info(f"[{session_id}] Sender task cancelled.") # Granular log
            try:
                await session_data["sender_task"]
                logger.info(f"[{session_id}] Sender task successfully awaited after cancellation.") # Granular log
            except asyncio.CancelledError:
                logger.info(f"[{session_id}] Sender task caught asyncio.CancelledError as expected during final await.") # Granular log
            except Exception as e:
                logger.error(f"[{session_id}] Error awaiting sender task after cancellation: {e}", exc_info=True)
        elif session_data["sender_task"] and session_data["sender_task"].done():
            logger.info(f"[{session_id}] Sender task was already finished.") # Granular log


        # Final cleanup for session data
        if session_id in connected_sessions:
            session_data["audio_buffer"].close() # Close the BytesIO buffer
            del connected_sessions[session_id]
            logger.info(f"[{session_id}] Session cleaned up and removed from store. Active sessions: {len(connected_sessions)}") # Granular log
        else:
            logger.warning(f"[{session_id}] Session not found in connected_sessions during final cleanup. Already removed?") # Granular log

        # Explicitly close the WebSocket from the server side.
        # This should generally be done, though FastAPI/Uvicorn might handle it on task completion.
        try:
            await websocket.close()
            logger.info(f"[{session_id}] WebSocket explicitly closed by server.") # Granular log
        except RuntimeError as e: # Catch if websocket is already closed by client
            logger.warning(f"[{session_id}] Could not explicitly close WebSocket (might be already closed by client): {e}") # Granular log
        except Exception as e:
            logger.error(f"[{session_id}] Error closing WebSocket: {e}", exc_info=True)

        logger.info(f"[{session_id}] Final cleanup for connection completed.") # Granular log