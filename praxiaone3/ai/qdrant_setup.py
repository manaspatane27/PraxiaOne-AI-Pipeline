from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance
from praxia_ai.settings import QDRANT_URL, QDRANT_COLLECTION, VECTOR_SIZE

client = QdrantClient(url=QDRANT_URL)

if client.collection_exists(QDRANT_COLLECTION):
    print("ℹ️ Collection already exists:", QDRANT_COLLECTION)
else:
    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(size=int(VECTOR_SIZE), distance=Distance.COSINE),
    )
    print("✅ Qdrant collection created:", QDRANT_COLLECTION)
