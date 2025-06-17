from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import os
import json

with open("professor_transcript.json", "r", encoding="utf-8") as f:
    transcript_data = json.load(f)

embeddings = OllamaEmbeddings(model="mxbai-embed-large")

db_location = "./chrome_langchain_db"
add_documents = not os.path.exists(db_location)

if add_documents:
    document = Document(
        page_content=transcript_data["text"],
        metadata={"language": transcript_data["language"]},
        id="transcript-001"
    )

vector_store = Chroma(
    collection_name="instructor_content",
    persist_directory=db_location,
    embedding_function=embeddings
)

if add_documents:
    vector_store.add_documents(documents=[document], ids=["transcript-001"])

retriever = vector_store.as_retriever(search_kwargs={"k": 1})
