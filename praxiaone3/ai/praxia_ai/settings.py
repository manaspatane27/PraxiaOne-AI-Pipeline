import os

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333").strip()
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "praxiaone_health_memory").strip()

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2").strip()

# Prefer backend-style env var name, fall back safely
VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", os.getenv("VECTOR_SIZE", "384")))
