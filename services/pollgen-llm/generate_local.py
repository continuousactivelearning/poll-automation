from main import generate_questions_llama_chain
from vector import create_vector_index_from_transcript
import json

def generate_questions_with_local_llm(transcript_text: str, settings: dict):
    create_vector_index_from_transcript(transcript_text)
    try:
        output = generate_questions_llama_chain(settings)
        questions = json.loads(output)
        return questions
    except Exception as e:
        print("LLaMA generation or JSON parsing failed:", e)
        return []
