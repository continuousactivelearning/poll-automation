from fastapi import FastAPI
from fastapi.responses import JSONResponse
import json
import os
from pydantic import BaseModel
from typing import List

app = FastAPI()

transcript_data = {}
stored_questions = []

if os.path.exists("professor_transcript.json"):
    with open("professor_transcript.json", "r", encoding="utf-8") as f:
        transcript_data = json.load(f)
else:
    transcript_data = {
        "text": "Transcript not found. Please generate it first.",
        "language": "English"
    }

@app.get("/transcript")
def get_transcript():
    return JSONResponse(content=transcript_data)

class PollQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: str
    concept: str

@app.post("/pollquestions")
def receive_poll_questions(questions: List[PollQuestion]):
    print("\nReceived Questions:")
    stored_questions.extend(questions)
    for q in questions:
        print(f"- {q.question}")
    return {"message": "Questions received and stored successfully"}

@app.get("/pollquestions")
def get_poll_questions():
    return stored_questions