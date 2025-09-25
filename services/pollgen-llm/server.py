import os
import pathlib
from dotenv import load_dotenv

load_dotenv()

user_home_env = os.getenv("USER_HOME")
if not user_home_env:
    raise RuntimeError("USER_HOME not set in .env")

pathlib.Path.home = lambda: pathlib.Path(user_home_env)

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, List, Optional
from datetime import datetime
from pathlib import Path
import json
from bson import ObjectId

# Gemini & Local generation imports
from gemini_generate import generate_questions_with_gemini
from generate_local import generate_questions_with_local_llm

# MongoDB setup
from pymongo import MongoClient
mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_collection = mongo_client["pollgen"]["pollquestions"]
manual_collection = mongo_client["pollgen"]["manualquestions"]

# FastAPI app setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Temporary fallback settings ===
current_settings = {
    "source": "gemini",
    "quantity": 1,
    "types": ["mcq"],
    "contextRange": "latest",
    "customRange": None,
    "frequency": 1
}

# === Models ===
class Settings(BaseModel):
    source: Literal["gemini", "ollama"]
    frequency: Optional[int] = None
    quantity: int
    types: Optional[List[Literal["mcq", "truefalse", "opinionpoll"]]] = None
    contextRange: Optional[str] = None
    customRange: Optional[str] = None

class Option(BaseModel):
    id: str
    text: str

class PollData(BaseModel):
    title: str
    types: str
    options: List[Option]
    timerEnabled: bool
    timerDuration: int
    timerUnit: str
    shortAnswerPlaceholder: Optional[str] = ""

# === API Endpoints ===
@app.post("/settings")
def save_settings(settings: Settings):
    global current_settings
    current_settings = settings.dict()
    print("Settings saved:", current_settings)
    return {"message": "Settings saved"}

@app.get("/settings")
def get_settings():
    return current_settings or {"message": "No settings found"}

@app.post("/save_manual_poll")
async def save_poll(data: PollData):
    result = manual_collection.insert_one(data.dict())
    return {"message": "Poll saved", "id": str(result.inserted_id)}

# === WebSocket LLM Handler ===
@app.websocket("/ws/llm")
async def ws_llm(websocket: WebSocket):
    await websocket.accept()
    print("LLM WebSocket connected")

    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                data = json.loads(raw_message)

                if not isinstance(data.get("transcripts"), list):
                    print("Invalid or missing 'transcripts' array.")
                    continue

                transcript_text = " ".join(seg.get("text", "") for seg in data["transcripts"] if seg.get("text"))

                if not transcript_text:
                    print("No 'text' field in incoming transcript")
                    continue

                print("Transcript received:\n", transcript_text[:1000])

                generator = {
                    "gemini": generate_questions_with_gemini,
                    "ollama": generate_questions_with_local_llm
                }.get(current_settings.get("source"))

                if not generator:
                    print("No valid generator found in settings:", current_settings)
                    continue

                questions = generator(transcript_text, current_settings)
                if not questions:
                    print("Generation failed or returned empty list")
                    continue

                print("Generated Questions:\n", json.dumps(questions, indent=2))

                now = datetime.utcnow()
                enriched = []
                for q in questions:
                    enriched.append({
                        "question": q.get("question"),
                        "options": q.get("options"),
                        "correct_answer": q.get("correct_answer"),
                        "explanation": q.get("explanation"),
                        "difficulty": q.get("difficulty"),
                        "concept": q.get("concept"),
                        "created_at": now,
                        "is_active": True,
                        "is_approved": False
                    })

                mongo_collection.insert_many(enriched)
                print(f"Saved {len(enriched)} questions to MongoDB")

            except Exception as e:
                print("Error processing transcript:", e)

    except Exception:
        print("LLM WebSocket disconnected")

# === Helper ===
def convert_object_ids(data):
    if isinstance(data, list):
        return [convert_object_ids(i) for i in data]
    elif isinstance(data, dict):
        return {k: convert_object_ids(v) for k, v in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    return data
