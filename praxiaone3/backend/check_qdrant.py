import os
import django
import sys
import json

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'praxiaone.settings')
django.setup()

from core.ai_memory import get_qdrant, get_qdrant_collection
from qdrant_client.models import Filter, FieldCondition, MatchValue

def check_qdrant():
    client = get_qdrant()
    collection = get_qdrant_collection()
    
    print(f"Checking Qdrant for all users...")
    
    results = client.scroll(
        collection_name=collection,
        limit=100,
        with_payload=True,
        with_vectors=False
    )[0]
    
    found_docs = {}
    for r in results:
        p = r.payload
        d_id = p.get("doc_id")
        title = p.get("title")
        if d_id not in found_docs:
            found_docs[d_id] = {"title": title, "count": 0}
        found_docs[d_id]["count"] += 1
        
    print("\nDocuments found in Qdrant:")
    for d_id, info in found_docs.items():
        print(f"ID: {d_id} | Title: {info['title']} | Chunks: {info['count']}")

if __name__ == "__main__":
    check_qdrant()
