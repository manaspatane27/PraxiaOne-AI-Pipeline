# pyre-ignore-all-errors
from __future__ import annotations

import time
import uuid
import os
import re
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings
from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from sentence_transformers import SentenceTransformer

# --- File text extraction ---
def _extract_text_from_file(path: str, max_size_mb: int = 20) -> str:
    """Extracts text from various file formats (PDF, DOCX, TXT, Images)."""
    import os
    try:
        file_size = os.path.getsize(path)
        max_bytes = max_size_mb * 1024 * 1024
        if file_size > max_bytes:
            return f"[File too large: {file_size / (1024*1024):.1f}MB. Max: {max_size_mb}MB]"
    except Exception:
        pass
    
    p = (path or "").lower()
    full_text = ""

    # 1. Image OCR
    if p.endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp")):
        try:
            import pytesseract
            from PIL import Image
            full_text = pytesseract.image_to_string(Image.open(path)).strip()
        except Exception as e:
            return f"[Error processing image: {str(e)}]"

    # 2. PDF Extraction (Optimized for Multi-Patient Documents)
    elif p.endswith(".pdf"):
        try:
            try:
                from pypdf import PdfReader
            except ImportError:
                from PyPDF2 import PdfReader
            reader = PdfReader(path)
            text_parts = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    # Prefix each page to help the AI keep patient cases separate
                    text_parts.append(f"\n[DOCUMENT PAGE {i+1}]\n{page_text}")
            full_text = "\n\n".join(text_parts).strip()
            
            print(f"--- [PDF EXTRACTION] --- File: {os.path.basename(path)} | Chars: {len(full_text)}")
            if not full_text:
                return "[Warning: PDF seems to contain no text. Might be an image/scan.]"
        except Exception as e:
            return f"[Error extracting PDF: {str(e)}]"

    # 3. DOCX Extraction
    elif p.endswith(".docx"):
        try:
            from docx import Document
            full_text = "\n".join([para.text for para in Document(path).paragraphs]).strip()
        except Exception as e:
            return f"[Error extracting DOCX: {str(e)}]"

    # 4. TXT and CSV Extraction
    elif p.endswith(".txt") or p.endswith(".csv"):
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read().strip()
        except Exception as e:
            return f"[Error reading file: {str(e)}]"

    return full_text

# --- Optimized Memory-Safe Chunker ---
def _chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Atomic Paragraph chunking. Ensures we split on white-space or page markers."""
    t = (text or "").strip()
    if not t: return []
    
    # First, split by double newlines (paragraphs) or our custom Page markers
    raw_blocks = re.split(r'(\n\s*\n|\[DOCUMENT PAGE \d+\])', t)
    
    chunks: List[str] = []
    current_chunk = ""
    
    for block in raw_blocks:
        if not block.strip(): continue
        
        # If adding this block exceeds the chunk size, we save and start new
        if len(current_chunk) + len(block) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = block
        else:
            current_chunk += "\n" + block
            
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    # Final guard: ensure no empty chunks and limit total
    return [c for c in chunks if len(c) > 20][:500]

# --- Qdrant & Embedding Helpers ---
def get_qdrant():
    from qdrant_client import QdrantClient
    return QdrantClient(url=getattr(settings, "QDRANT_URL", "http://localhost:6333"))

def get_qdrant_collection() -> str:
    # We move to v2 because PubMedBERT uses 768-dim vectors, which are incompatible with the old 384-dim collection.
    return getattr(settings, "QDRANT_COLLECTION", "praxiaone_health_memory_v2")

def ensure_collection_exists(client) -> None:
    from qdrant_client.models import VectorParams, Distance
    collection = get_qdrant_collection()
    try:
        if not client.collection_exists(collection):
            client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
    except Exception:
        pass

@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    # Advanced PubMedBERT (768-dim specialized medical model)
    return SentenceTransformer("microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext")

def embed_text(text: str) -> List[float]:
    model = get_embedder()
    return model.encode([text], normalize_embeddings=True)[0].tolist()

# --- Main Ingestion Logic ---
def ingest_uploaded_document(*, user_id: int, doc_id: int, doc_type: str, title: str, file_path: str) -> Dict[str, Any]:
    from qdrant_client.models import PointStruct
    import os
    
    # 1. Verify file exists
    if not os.path.exists(file_path):
        # Try local path if absolute failed
        alt_path = os.path.join(settings.MEDIA_ROOT, "uploads", os.path.basename(file_path))
        if os.path.exists(alt_path):
            file_path = alt_path
        else:
            return {"chunks": [], "error": f"File not found: {file_path}"}

    # 2. Extract Text
    text = _extract_text_from_file(file_path, max_size_mb=20)
    if not text.strip() or text.startswith(("[Error", "[File")):
        return {"chunks": [], "error": text or "No text extracted"}
    
    # 1. Chunking
    chunks = _chunk_text(text, chunk_size=1000, overlap=150)
    if not chunks: return {"chunks": [], "error": "No meaningful text after extraction"}

    try:
        client = get_qdrant()
        ensure_collection_exists(client)
        collection = get_qdrant_collection()
        
        # 4. Preparing Points
        points = []
        for idx, chunk in enumerate(chunks):
            point_id = str(uuid.uuid4())
            vec = embed_text(chunk)
            
            # Payload MUST have int user_id for filtering reliability
            payload = {
                "user_id": int(user_id),
                "source": "doc", 
                "doc_id": int(doc_id),
                "doc_type": str(doc_type), 
                "title": str(title), 
                "chunk_index": int(idx),
                "text": str(chunk), 
                "ts": int(time.time()),
            }
            points.append(PointStruct(id=point_id, vector=vec, payload=payload))
        
        # 5. Upsert
        client.upsert(collection_name=collection, points=points)
        return {"chunks": [{"chunk_index": i, "text_length": len(c)} for i, c in enumerate(chunks)]}
    except Exception as e:
        return {"chunks": [], "error": f"Qdrant ingest failed: {str(e)}"}

# --- Retrieval Primitives ---
def search_user_docs(*, user_id: int, query: str, limit: int = 15, doc_id: Optional[int] = None) -> List[Dict[str, Any]]:
    from qdrant_client.models import Filter, FieldCondition, MatchValue
    client = get_qdrant()
    collection = get_qdrant_collection()
    query_vec = embed_text(query)

    # Build Filter
    must_conditions = [
        FieldCondition(key="source", match=MatchValue(value="doc")),
        FieldCondition(key="user_id", match=MatchValue(value=int(user_id))),
    ]
    
    if doc_id:
        must_conditions.append(FieldCondition(key="doc_id", match=MatchValue(value=int(doc_id))))

    qfilter = Filter(must=must_conditions)

    try:
        # Using query_points for compatibility with modern qdrant-client
        results = client.query_points(
            collection_name=collection,
            query=query_vec,
            query_filter=qfilter,
            limit=limit,
            with_payload=True
        ).points
        
        print(f"\n[QDRANT SEARCH] Found {len(results)} chunks for User {user_id} (doc_id={doc_id})")
        
        return [
            {
                "id": r.id, 
                "score": r.score, 
                "text": r.payload.get("text", ""), 
                "title": r.payload.get("title", "")
            } for r in results
        ]
    except Exception as e:
        print(f"Qdrant Search Error: {e}")
        return []

def search_user_memories(*, user_id: int, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    from qdrant_client.models import Filter, FieldCondition, MatchValue
    client = get_qdrant()
    collection = get_qdrant_collection()
    query_vec = embed_text(query)
    qfilter = Filter(must=[
        FieldCondition(key="user_id", match=MatchValue(value=int(user_id))),
        FieldCondition(key="source", match=MatchValue(value="memory")),
    ])
    try:
        results = client.query_points(
            collection_name=collection, 
            query=query_vec, 
            query_filter=qfilter, 
            limit=limit, 
            with_payload=True
        ).points
        return [{"id": r.id, "score": r.score, "text": r.payload.get("text", "")} for r in results]
    except Exception: return []

def upsert_memory_point(*, user_id: int, text: str, kind: str = "user_message", point_id: Optional[str] = None) -> Dict[str, Any]:
    from qdrant_client.models import PointStruct
    client = get_qdrant()
    ensure_collection_exists(client)
    collection = get_qdrant_collection()
    pid = point_id or str(uuid.uuid4())
    vec = embed_text(text)
    payload = {"user_id": int(user_id), "text": str(text), "kind": str(kind), "source": "memory", "ts": int(time.time())}
    client.upsert(collection_name=collection, points=[PointStruct(id=pid, vector=vec, payload=payload)])
    return {"id": pid, "payload": payload}


# --- API View Classes ---
class QdrantHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            client = get_qdrant()
            collection = get_qdrant_collection()
            ensure_collection_exists(client)
            ok = client.collection_exists(collection)
            return Response({"ok": True, "collection": collection, "exists": bool(ok)})
        except Exception as e: return Response({"ok": False, "error": str(e)}, status=500)

class QdrantUpsertDemo(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            out = upsert_memory_point(user_id=request.user.id, text=request.data.get("text", "demo"))
            return Response({"ok": True, "inserted": out})
        except Exception as e: return Response({"ok": False, "error": str(e)}, status=500)

class QdrantSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        scope = (request.query_params.get("scope") or "memory").strip()
        try:
            hits = search_user_docs(user_id=request.user.id, query=q) if scope == "doc" else search_user_memories(user_id=request.user.id, query=q)
            return Response({"ok": True, "results": hits})
        except Exception as e: return Response({"ok": False, "error": str(e)}, status=500)