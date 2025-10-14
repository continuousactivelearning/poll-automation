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
Based STRICTLY on the educational content provided below, generate {num_questions} high-quality, challenging, and well-structured {difficulty} {type} questions.

CONTEXT (Instructor's explanation):
{context}

REQUIREMENTS:
1. All questions must be based ONLY on the content provided in the context above.
2. Design questions that test conceptual understanding, real-world application, and critical thinking — not just simple recall.
3. Each question must have exactly 4 answer choices (A–D) with only one correct answer.
4. Avoid vague, overly generic, or factually ungrounded questions.
5. Use precise academic language, and focus on key learning objectives conveyed in the instructor’s explanation.
6. Include conceptual tags and concise explanations for every question.

FORMAT your response strictly as a **valid JSON array**:
[
  {{
    "question": "Pose a meaningful and insightful question here.",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "A",
    "explanation": "Brief explanation of why this answer is correct.",
    "difficulty": "{difficulty}",
    "concept": "Main topic or concept being assessed"
  }},
  ...
]

IMPORTANT:
- Output must be ONLY a raw JSON array (no markdown, comments, or formatting like triple backticks).
- Ensure all required fields are present: "question", "options", "correct_answer", "explanation", "difficulty", and "concept".
- The response MUST be strictly parseable JSON. Any missing field or format error will invalidate the response.
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
