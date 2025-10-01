import chromadb
from chromadb.utils import embedding_functions

client = chromadb.Client()
collection = client.get_or_create_collection(
    name="poll_chunks",
    embedding_function=embedding_functions.DefaultEmbeddingFunction()
)

def insert_chunks(chunks):
    ids = [f"id_{i}" for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids)

def search(query, top_k=3):
    results = collection.query(query_texts=[query], n_results=top_k)
    return results["documents"][0] if results["documents"] else []
