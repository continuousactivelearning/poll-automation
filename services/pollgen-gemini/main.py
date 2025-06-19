from chunker import chunk_text
from vector import setup_collection, insert_chunks, search
from gemini import generate_question_from_context


# 1. Load and chunk transcript
with open("sample_transcript.txt", "r") as f:
    transcript = f.read()

chunks = chunk_text(transcript)

# 2. Store in Qdrant
setup_collection()
insert_chunks(chunks)

# 3. Simulate a query (e.g., "What is photosynthesis?")
query = "Explain how plants make energy from sunlight."
relevant_context = search(query)[0]

# 4. Get question from Gemini

mcq = generate_question_from_context(relevant_context)
print("\n✅ Generated MCQ:\n")
print(mcq)


