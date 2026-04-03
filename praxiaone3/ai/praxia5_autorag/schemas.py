from pydantic import BaseModel
from typing import List

class AutoRAGResponse(BaseModel):
    answer: str
    confidence: float
    citations: List[str]
    grounding_score: float
    llm_name: str = ""
