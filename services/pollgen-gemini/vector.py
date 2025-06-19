from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
qdrant = QdrantClient(host="localhost", port=6333)

COLLECTION_NAME = "lecture_chunks"

def setup_collection():
    if COLLECTION_NAME not in qdrant.get_collections().collections:
        qdrant.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

def insert_chunks(chunks):
    vectors = model.encode(chunks).tolist()
    points = [PointStruct(id=i, vector=vectors[i], payload={"text": chunks[i]}) for i in range(len(chunks))]
    qdrant.upload_points(collection_name=COLLECTION_NAME, points=points)

def search(query, top_k=1):
    vector = model.encode(query).tolist()
    hits = qdrant.search(collection_name=COLLECTION_NAME, query_vector=vector, limit=top_k)
    return [hit.payload["text"] for hit in hits]
