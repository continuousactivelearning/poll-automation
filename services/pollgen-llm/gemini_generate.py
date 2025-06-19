import os
from dotenv import load_dotenv
import google.generativeai as genai
from pymongo import MongoClient
from datetime import datetime
import json

# Loading API Key from .env file
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# MongoDB setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client.pollgen
collection = db.pollquestions

# Prompt Template
TEMPLATE = """
Based STRICTLY on the following educational content spoken by the instructor, generate {num_questions} high-quality {difficulty} {type} questions.

CONTEXT:
{context}

Each question should follow this JSON format:
[
  {{
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_answer": "A",
    "explanation": "...",
    "difficulty": "{difficulty}",
    "concept": "..."
  }}
]
Ensure strict JSON output only.
"""
def generate_questions_with_gemini(transcript, settings):
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt = TEMPLATE.format(
        context=transcript,
        num_questions=settings["numQuestions"],
        difficulty=settings["difficulty"],
        type=settings["type"]
    )
    response = model.generate_content(prompt)
    text = response.text.strip()

    try:
        json_start = text.find("[")
        json_end = text.rfind("]") + 1
        questions = json.loads(text[json_start:json_end])
        enriched = [{
            **q,
            "meeting_id": settings["meeting_id"],
            "created_at": datetime.utcnow(),
            "is_active": True,
            "is_approved": False
        } for q in questions]
        collection.insert_many(enriched)
        print("Questions saved to MongoDB")
        return enriched
    except Exception as e:
        print("Failed to parse or save Gemini response:", str(e))
        return []
