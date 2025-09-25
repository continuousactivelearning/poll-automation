import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import WebSocket
from ..utils.whisper_loader import load_whisper_model
from typing import Optional
from io import BytesIO
import sys

# Ensure UTF-8 logging
sys.stdout.reconfigure(encoding='utf-8')
print = lambda *args, **kwargs: __import__('builtins').print(*args, **{**kwargs, 'flush': True})

# Load environment configs
load_dotenv()
CHUNK_DURATION = int(os.getenv("CHUNK_DURATION", "30"))  # seconds
SILENCE_THRESHOLD = int(os.getenv("SILENCE_THRESHOLD", "5000"))  # bytes

# Load Whisper model (with device + compute_type fallback)
model = load_whisper_model()

class ClientState:
    def __init__(self):
        self.guest_id: Optional[str] = None
        self.meeting_id: Optional[str] = None
        self.audio_buffer = BytesIO()
        self.start_time = 0
        self.end_time = CHUNK_DURATION
        self.started = False
        self.queue: asyncio.Queue = asyncio.Queue()

def is_hallucinated_text(text: str) -> bool:
    """Filter common hallucinated phrases or empty results."""
    hallucinated_phrases = [
        "thanks for watching", "thank you for watching",
        "subscribe", "click the link", "undefined"
    ]
    lower = text.strip().lower()
    if not lower:
        return True
    for phrase in hallucinated_phrases:
        if phrase in lower:
            return True
    return False

async def process_audio(state: ClientState, websocket: WebSocket):
    print("🔁 Processor task started")
    while True:
        try:
            audio_chunk = await state.queue.get()
            print(f"🔊 Binary audio received, length: {len(audio_chunk)} bytes")

            state.audio_buffer.write(audio_chunk)

            if state.audio_buffer.getbuffer().nbytes >= SILENCE_THRESHOLD:
                print(f"📦 [{state.guest_id}] Buffer size: {state.audio_buffer.getbuffer().nbytes} bytes")
                state.audio_buffer.seek(0)

                print(f"🎧 [{state.guest_id}] Transcribing {state.audio_buffer.getbuffer().nbytes} bytes (WAV)")
                segments, _ = model.transcribe(BytesIO(state.audio_buffer.getvalue()), language="en")

                full_text = " ".join([seg.text for seg in segments])
                print(f"📝 [{state.guest_id}] Transcription: {full_text}")

                if is_hallucinated_text(full_text):
                    print(f"⚠️ [{state.guest_id}] Skipped sending hallucinated/empty transcription.")
                    state.audio_buffer = BytesIO()
                    continue

                await websocket.send_text(json.dumps({
                    "type": "transcription",
                    "text": full_text,
                    "start": state.start_time,
                    "end": state.end_time,
                    "guestId": state.guest_id,
                    "meetingId": state.meeting_id
                }))

                state.audio_buffer = BytesIO()
                state.start_time += CHUNK_DURATION
                state.end_time += CHUNK_DURATION

        except Exception as e:
            print(f"💥 [{state.guest_id}] Error during processing: {e}")
            state.audio_buffer = BytesIO()
            continue

async def handle_client(websocket: WebSocket):
    print("⚡ handle_client() triggered")
    state = ClientState()

    try:
        processor = asyncio.create_task(process_audio(state, websocket))
        print("🔁 Processor task started")

        while True:
            message = await websocket.receive()

            if "text" in message:
                print("📝 Received text message")
                try:
                    data = json.loads(message["text"])
                    print("📦 Parsed JSON:", data)

                    if data.get("type") == "start":
                        state.guest_id = data.get("guestId")
                        state.meeting_id = data.get("meetingId")
                        state.started = True
                        print(f"✅ [{state.guest_id}] Session started for meeting {state.meeting_id}")
                        await websocket.send_text(json.dumps({"type": "ack", "message": "Session started"}))
                        continue
                    if data.get("type") == "stop":
                        print(f"🛑 [{state.guest_id}] Stop signal received. Flushing buffer...")

                        if state.audio_buffer.getbuffer().nbytes > 0:
                            state.audio_buffer.seek(0)
                            segments, _ = model.transcribe(BytesIO(state.audio_buffer.getvalue()), language="en")

                            full_text = " ".join([seg.text for seg in segments])
                            print(f"📝 [{state.guest_id}] Final Transcription: {full_text}")

                            if not is_hallucinated_text(full_text):
                                await websocket.send_text(json.dumps({
                                    "type": "transcription",
                                    "text": full_text,
                                    "start": state.start_time,
                                    "end": state.end_time,
                                    "guestId": state.guest_id,
                                    "meetingId": state.meeting_id
                                }))

                        await websocket.send_text(json.dumps({ "type": "done" }))
                        print(f"✅ [{state.guest_id}] Done sent. Closing soon.")
                        break

                except json.JSONDecodeError:
                    print("❌ Invalid JSON message")
                    continue

            elif "bytes" in message:
                print(f"🔊 Binary audio received, length: {len(message['bytes'])} bytes")

                if not state.started:
                    print("⚠️ Audio received before 'start' message. Skipping.")
                    continue

                await state.queue.put(message["bytes"])
                print(f"📤 Audio pushed to queue for guest {state.guest_id}")

    except Exception as e:
        print(f"💥 [{state.guest_id}] WebSocket error: {e}")

    finally:
        try:
            if websocket.application_state.value != 3:
                if not websocket.client_state.name == "DISCONNECTED":
                    await websocket.close()
                print(f"🔒 [{state.guest_id}] WebSocket closed")
        except RuntimeError as e:
            print(f"❗[{state.guest_id}] Close error: {e}")
