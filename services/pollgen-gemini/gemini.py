import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

def generate_question_from_context(context: str) -> str:
    prompt = f"""
    You are an educational assistant. Read the following transcript chunk and generate one multiple-choice question.

    Provide exactly 4 options (a, b, c, d) and specify the correct answer clearly.Don't write According to the transcript, in the starting ,just start with question directly
    Transcript Chunk:
    {context}

    Format:
    Question: ...
    a) ...
    b) ...
    c) ...
    d) ...
    Answer: ...
    """

    headers = {"Content-Type": "application/json"}

    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt.strip()}
                ]
            }
        ]
    }

    response = requests.post(GEMINI_API_URL, headers=headers, data=json.dumps(body))

    if response.status_code == 200:
        try:
            full_response = response.json()
            print("🔍 Raw Gemini response:")
            print(json.dumps(full_response, indent=2))

            return full_response['candidates'][0]['content']['parts'][0].get('text', "⚠️ No 'text' in response.")
        except Exception as e:
            return f"❌ Error parsing response: {e}"
    else:
        return f"❌ Error {response.status_code}: {response.text}"
