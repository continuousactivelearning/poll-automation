import streamlit as st
from chunker import chunk_text
from vector import insert_chunks, search
from gemini import generate_poll

st.set_page_config(page_title="Poll Generator", layout="centered")
st.title("🎓 AI Poll Generator")

with open("sample_transcript.txt", "r", encoding="utf-8") as f:
    transcript = f.read()

chunks = chunk_text(transcript)
insert_chunks(chunks)

st.sidebar.header("Host Preferences")
question_type = st.sidebar.selectbox("Select Question Type", ["MCQ", "True/False"])
difficulty = st.sidebar.radio("Difficulty Level", ["easy", "medium", "hard"])
num_questions = st.sidebar.slider("Number of Questions", 2, 4, 3)

if st.button("Generate Poll"):
    relevant_chunks = search(transcript, n_results=3)
    context = " ".join(relevant_chunks[0])
    questions = generate_poll(context, question_type, difficulty, num_questions)
    st.subheader("📝 Generated Questions:")
    for i, q in enumerate(questions, 1):
        st.write(f"{q}")
