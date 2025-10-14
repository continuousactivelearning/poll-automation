from chunker import chunk_transcript
from vector import insert_chunks, search
from gemini import generate_poll

# Step 1: Load and chunk transcript
chunks = chunk_transcript("transcript.json", chunk_size=30)

# Step 2: Insert into vector store
insert_chunks(chunks)

# Step 3: Query & generate questions
context_chunks = search("Tourist destinations in India")
context = " ".join(context_chunks)

questions = generate_poll(context, question_type="MCQ", difficulty="medium", num_questions=3)

# Step 4: Output
print("\n📋 Generated Questions:\n")
for i, q in enumerate(questions, 1):
    print(f" {q}")
