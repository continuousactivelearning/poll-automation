import pathlib
#Reason for adding the home directory: Force the home directory to avoid Path.home() failure in Windows subprocesses used by ChromaDB
pathlib.Path.home = lambda: pathlib.Path("C:/Users/keerthana J") #Add your home directory here
from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
from pathlib import Path
from datetime import datetime
import json, asyncio
from bson import ObjectId
from gemini_generate import generate_questions_with_gemini
from generate_local import generate_questions_with_local_llm


#MongoDB Setup
from pymongo import MongoClient
mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_collection = mongo_client["pollgen"]["pollquestions"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_settings = {}
transcript_data = {}
clients: set[WebSocket] = set()

DATA_FOLDER = Path("./sample_transcripts")
JSON_FILES = sorted(DATA_FOLDER.glob("*.json"))
current_index = 0

if JSON_FILES:
    with open(JSON_FILES[0], "r", encoding="utf-8") as f:
        transcript_data = json.load(f)

#Schema of Host Settings
class Settings(BaseModel):
    meeting_id: str
    questionSource: Literal["gemini", "llama"]
    numQuestions: int
    type: Literal["MCQ", "True/False", "Opinion Poll"]
    difficulty: Literal["easy", "medium", "hard"]

#Host settings Endpoint
@app.post("/settings")
def save_settings(settings: Settings):
    global current_settings
    current_settings = settings.dict()
    print(f"Settings updated at {datetime.now()}:\n{current_settings}")
    return {"message": "Settings saved"}

@app.get("/settings")
def get_settings():
    return current_settings or {"message": "No settings found"}

#Transcript Endpoint
@app.get("/transcripts")
def get_transcripts():
    return JSONResponse(content=transcript_data)

@app.websocket("/ws/transcripts")
async def ws_transcripts(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    print(f"WebSocket connected: {datetime.now()}")

    try:
        while True:
            await asyncio.sleep(60)  
    except Exception:
        print("WebSocket disconnected")
    finally:
        clients.discard(websocket)

#Transcript Rotation module
async def rotate_transcripts():
    global current_index, transcript_data

    while True:
        await asyncio.sleep(180)  # Rotate every 3 minutes

        if not JSON_FILES:
            continue

        current_index = (current_index + 1) % len(JSON_FILES)
        file = JSON_FILES[current_index]

        try:
            with open(file, "r", encoding="utf-8") as f:
                transcript_data = json.load(f)

            print(f"Transcript rotated: {file.name} @ {datetime.now()}")

            disconnected = set()
            for client in clients:
                try:
                    await client.send_json({"status": "updated"})
                except Exception:
                    disconnected.add(client)
            clients.difference_update(disconnected)

        except Exception as e:
            print(f"Error loading transcript: {e}")

@app.on_event("startup")
async def startup_event():
    if JSON_FILES:
        asyncio.create_task(rotate_transcripts())

#Question Generation
def convert_object_ids(data):
    if isinstance(data, list):
        return [convert_object_ids(i) for i in data]
    elif isinstance(data, dict):
        return {k: convert_object_ids(v) for k, v in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    return data

@app.post("/generate")
def generate_from_transcript():
    print("Generation requested...")
    start=datetime.now()
    

    if not transcript_data.get("text"):
        return JSONResponse({"error": "No transcript found"}, status_code=400)

    generator = {
        "gemini": generate_questions_with_gemini,
        "llama": generate_questions_with_local_llm
    }.get(current_settings.get("questionSource"))

    if not generator:
        return JSONResponse({"error": "Invalid question source"}, status_code=400)

    questions = generator(transcript_data["text"], current_settings)
    questions = convert_object_ids(questions)  

    if not questions:
        return JSONResponse({"error": "Question generation failed"}, status_code=500)

    try:
        mongo_collection.insert_one({
            "meeting_id": current_settings["meeting_id"],
            "questions": questions,
            "generated_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to save to MongoDB: {e}")
    end=datetime.now()
    print(end-start)
    return {
        "message": "Questions generated successfully",
        "count": len(questions),
        "questions": questions
    }