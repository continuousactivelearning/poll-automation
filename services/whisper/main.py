from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uuid, json, os
from faster_whisper import WhisperModel

app = FastAPI()

print("[Whisper] Loading model...")
model = WhisperModel("base", compute_type="int8", device="cpu")
print("[Whisper] Model loaded.")

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
            segments, _ = model.transcribe(filename)
            text = ' '.join([seg.text for seg in segments])
            print(f"[Whisper WS] Transcription done: {text.strip()[:80]}...")

            os.remove(filename)
            print(f"[Whisper WS] Deleted temp file: {filename}")

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
