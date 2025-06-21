import chromadb
from chromadb.utils import embedding_functions

client = chromadb.Client()
COLLECTION_NAME = "transcript_chunks"

embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
collection = client.get_or_create_collection(name=COLLECTION_NAME, embedding_function=embedding_func)

def insert_chunks(chunks):
    ids = [str(i) for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids)

def search(query, n_results=3):
    result = collection.query(query_texts=[query], n_results=n_results)
    return result["documents"]
