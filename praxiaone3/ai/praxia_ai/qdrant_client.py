import os
from qdrant_client import QdrantClient

def get_client() -> QdrantClient:
    # Use env if present, otherwise localhost
    host = os.getenv("QDRANT_HOST", "localhost")
    port = int(os.getenv("QDRANT_PORT", "6333"))
    return QdrantClient(host=host, port=port)
