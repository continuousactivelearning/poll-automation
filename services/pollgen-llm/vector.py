from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

import os

embeddings = OllamaEmbeddings(model="mxbai-embed-large")
db_location = "./chroma_langchain_db"

vector_store = Chroma(
    collection_name="instructor_content",
    persist_directory=db_location,
    embedding_function=embeddings
)

def create_vector_index_from_transcript(transcript_text: str):
    # Always reset and re-add for latest transcript
    vector_store.delete(ids=["transcript-001"])
    document = Document(
        page_content=transcript_text,
        metadata={"source": "live-transcript"},
        id="transcript-001"
    )
    vector_store.add_documents(documents=[document], ids=["transcript-001"])

def get_retriever():
    return vector_store.as_retriever(search_kwargs={"k": 1})
