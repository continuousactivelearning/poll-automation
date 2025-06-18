import asyncio
import json
import uuid
import numpy as np
import io
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

try:
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    print("[Warning] torch not installed, defaulting to CPU")
    device = "cpu"

compute_type = "float16" if device == "cuda" else "int8"
model = WhisperModel("base", compute_type=compute_type, device=device)
print(f"[Whisper] Model loaded on {device} with {compute_type}", flush=True)

SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2
BUFFER_DURATION_SECONDS = 30
BUFFER_SIZE_BYTES = SAMPLE_RATE * BYTES_PER_SAMPLE * BUFFER_DURATION_SECONDS

connected_sessions = {}

@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    session_id = str(uuid.uuid4())
    session_data = {
        "websocket": websocket,
        "meeting_id": "N/A",
        "speaker": "N/A",
        "audio_buffer": io.BytesIO(),
        "transcript_queue": asyncio.Queue(),
        "processing_task": None,
        "shutdown_event": asyncio.Event(), # Event to signal shutdown to processing task
        "transcription_finished_event": asyncio.Event(), # Signals when all transcription is done for a session
        "websocket_closed_by_endpoint": asyncio.Event(), # Signals websocket_endpoint has completed its cleanup
    }
    connected_sessions[session_id] = session_data

    logger.info(f"[Backend WS] Client connected. Session ID: {session_id}")

    try:
        await websocket.accept()

        sender_task = asyncio.create_task(send_transcriptions(session_data))
        session_data["processing_task"] = asyncio.create_task(
            process_audio_stream(session_data)
        )

        while True:
            try:
                # Attempt to receive a message. This is the main blocking point.
                message = await websocket.receive()

                if isinstance(message, dict) and "text" in message:
                    data = json.loads(message["text"])
                    if data.get("type") == "start":
                        session_data["meeting_id"] = data.get("meetingId", "N/A")
                        session_data["speaker"] = data.get("speaker", "N/A")
                        logger.info(f"[Backend WS] Session {session_id} started for meeting: {session_data['meeting_id']}, speaker: {session_data['speaker']}")
                    elif data.get("type") == "end":
                        logger.info(f"[Backend WS] Received 'end' signal for session {session_id}. Signalling shutdown.")
                        session_data["shutdown_event"].set()
                        # Do NOT break here. Allow more messages to come if client sends them.
                        # The loop will naturally exit on client disconnect or if the processing is truly finished.

                elif isinstance(message, dict) and "bytes" in message:
                    audio_chunk = message["bytes"]
                    session_data["audio_buffer"].write(audio_chunk)

            except WebSocketDisconnect:
                # THIS IS THE KEY CHANGE:
                # If the client disconnects, we catch it immediately.
                logger.info(f"[Backend WS] Client disconnected (session: {session_id}). Exiting receive loop.")
                session_data["shutdown_event"].set() # Signal shutdown to other tasks
                break # IMMEDIATELY break out of the while True loop

            except Exception as e:
                # Catch any other unexpected errors during receive
                logger.error(f"[Backend WS] Unexpected error during receive for session {session_id}: {e}", exc_info=True)
                session_data["shutdown_event"].set()
                break # Exit loop on unhandled error

            # After processing a message (or if no message came and we would block),
            # check if shutdown is requested AND all background tasks are done and queue is empty.
            # This handles the case where the frontend gracefully sends "end" and then no more data.
            if session_data["shutdown_event"].is_set() and \
               session_data["transcription_finished_event"].is_set() and \
               session_data["transcript_queue"].empty():
                logger.info(f"[Backend WS] Graceful shutdown for {session_id}: processing and queue empty. Exiting receive loop.")
                break # Exit the receive loop if everything is truly finished.

    finally:
        logger.info(f"[Backend WS] WebSocket endpoint for session {session_id} entering finally block for cleanup.")
        
        # Ensure shutdown signal is sent if loop broke unexpectedly (e.g., from an error)
        if not session_data["shutdown_event"].is_set():
            session_data["shutdown_event"].set()
        
        # Wait for audio processing task to complete its work and put all results in queue
        if session_data["processing_task"]:
            await session_data["processing_task"]
        
        # Wait for the sender task to finish sending everything from the queue,
        # or acknowledge that it can't send anymore.
        await session_data["transcription_finished_event"].wait()

        # Signal to the sender task that *this* endpoint is taking over final closure.
        # This is essential to prevent sender from trying to send on a socket this task might close.
        session_data["websocket_closed_by_endpoint"].set()
        
        # Give the sender task a tiny moment to acknowledge the closure signal and exit its loop
        await asyncio.sleep(0.01) 
        
        # Ensure the sender task is truly done (cancel if it's still running)
        if not sender_task.done():
            sender_task.cancel()
            try:
                await sender_task 
            except asyncio.CancelledError:
                pass

        # Final cleanup for session data
        if session_id in connected_sessions:
            session_data["audio_buffer"].close()
            del connected_sessions[session_id]
            logger.info(f"[Backend WS] Session {session_id} cleaned up.")


# The process_audio_stream and send_transcriptions functions remain AS IS from previous answer.
# Please ensure they are identical to the last version I provided.
# No changes are needed there for this specific issue.
async def process_audio_stream(session_data: dict): # Pass session_data directly
    session_id_log = session_data["websocket"].scope.get("path", "N/A")
    buffer = session_data["audio_buffer"]

    try:
        while True:
            await asyncio.sleep(0.05)

            current_buffer_length = buffer.tell()

            if current_buffer_length >= BUFFER_SIZE_BYTES or \
               (session_data["shutdown_event"].is_set() and current_buffer_length > 0):

                buffer.seek(0)
                audio_bytes = buffer.read()
                buffer.seek(0)
                buffer.truncate(0)

                if not audio_bytes:
                    continue

                audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

                logger.info(f"[Whisper Service] Transcribing {audio_np.shape[0] / SAMPLE_RATE:.2f} seconds of audio for session {session_id_log}...")

                segments_generator, info = model.transcribe(
                    audio_np,
                    beam_size=5,
                    word_timestamps=True,
                    language=None,
                    condition_on_previous_text=False,
                )

                full_transcript_text = []
                last_end_time = 0.0
                segment_start_time = 0.0
                try:
                    first_segment = next(segments_generator)
                    full_transcript_text.append(first_segment.text)
                    last_end_time = first_segment.end
                    segment_start_time = first_segment.start
                    for segment in segments_generator:
                        full_transcript_text.append(segment.text)
                        last_end_time = segment.end
                except StopIteration:
                    pass

                if full_transcript_text:
                    transcription_text = " ".join(full_transcript_text).strip()
                    result = {
                        "type": "transcription",
                        "meetingId": session_data["meeting_id"],
                        "speaker": session_data["speaker"],
                        "text": transcription_text,
                        "segment_start": round(segment_start_time, 2),
                        "segment_end": round(last_end_time, 2),
                        "language": info.language if info and info.language else "unknown",
                        "is_final": session_data["shutdown_event"].is_set() and buffer.tell() == 0
                    }
                    await session_data["transcript_queue"].put(result)
                    logger.info(f"[Whisper Service] Sent transcription for session {session_id_log}: {transcription_text[:50]}...")
                else:
                    logger.info(f"[Whisper Service] No speech detected in chunk for session {session_id_log}.")

            if session_data["shutdown_event"].is_set() and buffer.tell() == 0:
                logger.info(f"[Whisper Service] Processing task for session {session_id_log} received shutdown and buffer is empty. Exiting loop.")
                break

    except asyncio.CancelledError:
        logger.info(f"[Whisper Service] Processing task for session {session_id_log} cancelled.")
    except Exception as e:
        logger.error(f"[Whisper Service] Transcription error for session {session_id_log}: {e}", exc_info=True)
        await session_data["transcript_queue"].put({"type": "error", "message": str(e), "is_final": True})
    finally:
        session_data["transcription_finished_event"].set()
        logger.info(f"[Whisper Service] Processing task for session {session_id_log} finished.")


async def send_transcriptions(session_data: dict): # Pass session_data directly
    session_id_log = session_data["websocket"].scope.get("path", "N/A")
    websocket = session_data["websocket"]

    try:
        while True:
            # Crucial: Check if the main endpoint has signaled its complete closure process.
            if session_data["websocket_closed_by_endpoint"].is_set():
                logger.info(f"[Backend WS] Sender for {session_id_log}: websocket_closed_by_endpoint set. Exiting send loop.")
                break

            try:
                # Use a timeout to allow periodic checks of the closed_by_endpoint event.
                result = await asyncio.wait_for(session_data["transcript_queue"].get(), timeout=0.1)
            except asyncio.TimeoutError:
                # If timeout, check if processing is finished and queue is empty,
                # AND confirm main endpoint hasn't started its closing sequence.
                if session_data["transcription_finished_event"].is_set() and \
                   session_data["transcript_queue"].empty() and \
                   not session_data["websocket_closed_by_endpoint"].is_set():
                    logger.info(f"[Backend WS] Sender for {session_id_log}: Queue empty and processing finished. Exiting.")
                    break
                continue

            # Attempt to send the result. This is where the ASGI RuntimeError could occur.
            try:
                await websocket.send_json(result)
                logger.debug(f"[Backend WS] Sent result to client for session {session_id_log}: {result['text'][:20]}...")
            except RuntimeError as e:
                # If we get this error, the connection is gone. Stop trying to send.
                logger.error(f"[Backend WS] Error sending transcription (connection likely closed) for session {session_id_log}: {e}")
                break

            # If the result indicates finality and processing is truly complete, and no more items expected.
            if result.get("is_final") and session_data["transcription_finished_event"].is_set() and \
               session_data["transcript_queue"].empty():
                logger.info(f"[Backend WS] Sender for {session_id_log}: Final message sent and processing finished. Exiting.")
                break

    except asyncio.CancelledError:
        logger.info(f"[Backend WS] Sender task for session {session_id_log} cancelled.")
    except Exception as e:
        logger.error(f"[Backend WS] Error in send_transcriptions for session {session_id_log}: {e}", exc_info=True)
    finally:
        logger.info(f"[Backend WS] Transcription sender task for session {session_id_log} finished.")