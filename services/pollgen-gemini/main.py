from chunker import chunk_text
from vector import insert_chunks, search
from gemini import generate_poll

with open("sample_transcript.txt", "r", encoding="utf-8") as f:
    transcript = f.read()

chunks = chunk_text(transcript)
insert_chunks(chunks)

context = " ".join(search("contextual question")[0])
questions = generate_poll(context, "MCQ", "medium", 3)
for i, q in enumerate(questions, 1):
    print(f"Q{i}: {q}")
