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
Based STRICTLY on the educational content provided below, generate {num_questions} high-quality, challenging, and well-structured {difficulty} {types} questions.

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
    print("[Gemini] Settings received:", settings)

    prompt = TEMPLATE.format(
        context=transcript,
        num_questions=settings["quantity"],
        difficulty="medium",
        types=", ".join(settings["types"]) if settings["types"] else "mcq"
    )
    print("[Gemini] Prompt preview:\n", prompt[:500])

    model = genai.GenerativeModel("gemini-2.0-flash")

    try:
        response = model.generate_content(prompt)
    except Exception as e:
        print("[Gemini] API Error:", str(e))
        return []

    text = response.text.strip()
    print("[Gemini] Raw LLM output:\n", text[:1000])

    try:
        json_start = text.find("[")
        json_end = text.rfind("]") + 1
        parsed = text[json_start:json_end]
        questions = json.loads(parsed)

        if not isinstance(questions, list):
            print("[Gemini] Parsed output is not a list:", parsed)
            return []

        enriched = [{
            **q,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "is_approved": True
        } for q in questions]

        collection.insert_many(enriched)
        print("[Gemini] Saved", len(enriched), "questions to MongoDB")
        return enriched

    except Exception as e:
        print("[Gemini] Failed to parse or save response:", str(e))
        return []

