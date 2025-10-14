# streamlit_app.py
import streamlit as st
from chunker import chunk_transcript
from vector import insert_chunks, search
from gemini import generate_poll

st.set_page_config(page_title="Poll Generator with Gemini", layout="centered")
st.title("🧠 Gemini AI Poll Generator")

# Sidebar inputs
st.sidebar.header("Preferences")
question_type = st.sidebar.selectbox("Select Question Type", ["MCQ", "True/False"])
difficulty = st.sidebar.selectbox("Select Difficulty", ["easy", "medium", "hard"])
num_questions = st.sidebar.slider("Number of Questions", min_value=1, max_value=5, value=3)

if st.button("Generate Poll"):
    with st.spinner("Chunking transcript and embedding..."):
        chunks = chunk_transcript("transcript.json", chunk_size=30)
        insert_chunks(chunks)
        relevant_chunks = search("Generate questions", top_k=3)
        context = " ".join(relevant_chunks)

    with st.spinner("Generating questions with Gemini..."):
        questions = generate_poll(context, question_type, difficulty, num_questions)

    st.subheader("📝 Generated Questions:")
    for i, q in enumerate(questions, 1):
        st.markdown(f" {q}")
