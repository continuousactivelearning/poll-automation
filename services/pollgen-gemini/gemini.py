import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


def generate_poll(context, question_type, difficulty, num_questions=3):
    prompt = f"""
You are a quiz generator. Based on the context below, generate {num_questions} {difficulty} {question_type} questions.

Context:
{context}

Questions:
"""
    response = model.generate_content(prompt)
    return response.text.strip().split("\n")
