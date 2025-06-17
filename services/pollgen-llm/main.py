from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever
import requests
import json
import re

model = OllamaLLM(model="llama3.2")

template = """
Based STRICTLY on the following educational content spoken by the instructor, generate {num_questions} high-quality, thought-provoking multiple-choice questions.

CONTEXT (Instructor's content):
{combined_context}

REQUIREMENTS:
1. Questions must be directly based ONLY on the provided context
2. Create challenging questions that test deep understanding, not just recall
3. Include questions about concepts, applications, comparisons, and implications
4. Each question should have 4 options with only one correct answer
5. Avoid generic or trivial questions
6. Focus on the key learning objectives from the instructor's explanations

FORMAT your response as a JSON array:
[
    {{
        "question": "Your challenging question here",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correct_answer": "A",
        "explanation": "Brief explanation of why this is correct",
        "difficulty": "medium/hard",
        "concept": "Main concept being tested"
    }}
]

Generate questions now and give only the questions array alone without any additional data:
Ensure the response is STRICTLY valid JSON and does not include markdown, extra commentary, or triple backticks.

Important: Your output MUST include all of the following fields for every question:
- "question"
- "options"
- "correct_answer"
- "explanation"
- "difficulty"
- "concept"

Any missing field will invalidate the response.
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

while True:
    num = input("Enter number of questions to generate (q to quit): ")
    if num.strip().lower() == 'q':
        break

    docs = retriever.invoke("Generate quiz questions based only on this content.")
    combined_context = "\n\n".join([doc.page_content for doc in docs])

    result = chain.invoke({"combined_context": combined_context, "num_questions": num})
    print("Generated Questions:\n", result)

    try:
        json_match = re.search(r"\[\s*{.*?}\s*\]", result, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON array found in the model response.")

        json_string = json_match.group(0)
        questions_json = json.loads(json_string)

        response = requests.post("http://localhost:8000/pollquestions", json=questions_json)
        if response.status_code == 200:
            print("Questions successfully sent to /pollquestions")
        else:
            print(f"Failed to POST. Status: {response.status_code}, Message: {response.text}")
    except Exception as e:
        print("Error parsing or posting JSON:", str(e))  