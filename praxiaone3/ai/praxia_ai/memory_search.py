from typing import Any, Dict, List, Optional

from qdrant_client.models import Filter

from .qdrant_client import get_client
from .constants import COLLECTION_NAME

def search_memory(vector: list[float], limit: int = 5, flt: Optional[Filter] = None) -> List[Dict[str, Any]]:
    client = get_client()
    hits = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=limit,
        query_filter=flt,
        with_payload=True,
    )
    return [
        {
            "id": h.id,
            "score": float(h.score),
            "payload": h.payload or {},
        }
        for h in hits
    ]
