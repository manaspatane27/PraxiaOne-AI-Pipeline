from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from django.conf import settings

class VectorStore:
    def __init__(self, collection="praxia5"):
        url = getattr(settings, "QDRANT_URL", "http://localhost:6333").strip()
        self.client = QdrantClient(url=url)
        self.collection = collection

    def upsert(self, vectors, payloads):
        size = len(vectors[0])
        try:
            exists = bool(self.client.collection_exists(self.collection))
        except Exception:
            exists = False

        if not exists:
            self.client.recreate_collection(
                collection_name=self.collection,
                vectors_config={"size": size, "distance": "Cosine"}
            )

        points = [
            PointStruct(id=i, vector=vectors[i], payload=payloads[i])
            for i in range(len(vectors))
        ]

        self.client.upsert(collection_name=self.collection, points=points)

    def search(self, query_vector, limit=5):
        return self.client.search(
            collection_name=self.collection,
            query_vector=query_vector,
            limit=limit
        )
