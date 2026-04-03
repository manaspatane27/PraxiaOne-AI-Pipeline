from sentence_transformers import SentenceTransformer
from .settings import EMBED_MODEL

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model

def embed_text(text: str):
    model = get_model()
    return model.encode(text).tolist()
