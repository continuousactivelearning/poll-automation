import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_poll(context, question_type="MCQ", difficulty="medium", num_questions=3):
    prompt = f"""
You are a quiz generator. Based on the context below, generate {num_questions} {difficulty} {question_type} questions.
Provide 4 options (A, B, C, D) for MCQs or 'True'/'False' for True/False questions. Do not include explanations.

Context:
{context}

Questions:
"""
    response = model.generate_content(prompt)
    return response.text.strip().split("\n")
