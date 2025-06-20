from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import get_retriever

model = OllamaLLM(model="llama3.2")

template = """
Based STRICTLY on the following educational content spoken by the instructor, generate {num_questions} high-quality, thought-provoking {question_type} questions.

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
        "difficulty": "{difficulty}",
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
"""
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model
def generate_questions_llama_chain(settings: dict):
    retriever = get_retriever()
    docs = retriever.invoke("generate good questions")
    combined_context = docs[0].page_content
    return chain.invoke({
        "combined_context": combined_context,
        "num_questions": settings["numQuestions"],
        "question_type": settings["type"],
        "difficulty": settings["difficulty"]
    })
