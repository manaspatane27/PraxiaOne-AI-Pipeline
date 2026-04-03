from typing import Any, Dict, Optional
from qdrant_client.models import PointStruct

from .qdrant_client import get_client
from .constants import COLLECTION_NAME

def store_memory(point_id: int, vector: list[float], payload: Optional[Dict[str, Any]] = None) -> None:
    client = get_client()
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=vector,
                payload=payload or {}
            )
        ],
    )
