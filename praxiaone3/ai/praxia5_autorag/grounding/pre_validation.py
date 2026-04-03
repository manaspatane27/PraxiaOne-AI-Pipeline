import numpy as np

def grounding_score(query_emb, retrieved_embs):
    if not retrieved_embs:
        return 0.0
    sims = [np.dot(query_emb, emb) for emb in retrieved_embs]
    return float(max(sims))
