from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uuid, json, os, time
from datetime import timedelta
from faster_whisper import WhisperModel
import torch
import sys
sys.stdout.reconfigure(line_buffering=True)

app = FastAPI()

print("[Whisper] Loading model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if device == "cuda" else "int8"
model = WhisperModel("base", compute_type=compute_type, device=device)
print(f"[Whisper] Model loaded on {device} with {compute_type}", flush=True)

def format_duration(seconds: float) -> str:
    return str(timedelta(seconds=round(seconds)))

@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[Whisper WS] Connection accepted.")

    try:
        while True:
            print("[Whisper WS] Waiting for audio...")
            audio_bytes = await websocket.receive_bytes()
            print(f"[Whisper WS] Received audio ({len(audio_bytes)} bytes)")

            filename = f"temp_{uuid.uuid4().hex}.wav"
            with open(filename, 'wb') as f:
                f.write(audio_bytes)
            print(f"[Whisper WS] Audio saved to {filename}")

            print("[Whisper WS] Starting transcription...")
            start_time = time.time()

            segments, info = model.transcribe(filename)
            text = ' '.join([seg.text for seg in segments])

            end_time = time.time()
            processing_time = end_time - start_time

            os.remove(filename)
            print(f"[Whisper WS] Deleted temp file: {filename}")

            print(f"[Whisper WS] Transcription done: {text.strip()[:80]}...")
            print(f"[Whisper WS] Audio Length    : {format_duration(info.duration)}")
            print(f"[Whisper WS] Processing Time : {format_duration(processing_time)}\n")

            await websocket.send_text(json.dumps({
                "type": "transcription",
                "meetingId": "dummy-meeting",
                "speaker": "host",
                "text": text
            }))
            print("[Whisper WS] Transcription sent.\n")

    except WebSocketDisconnect:
        print("[Whisper WS] Client disconnected.")
    except Exception as e:
        print(f"[Whisper WS ERROR] {type(e).__name__}: {e}")
