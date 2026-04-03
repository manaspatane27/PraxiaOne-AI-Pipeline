from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import sys
import os

# Ensure the current directory is in the path for internal imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from reasoning import reason_with_sources
from knowledge_bridge import KnowledgeBridge

app = FastAPI(title="Praxia5Chronic GraphRAG Engine")
bridge = KnowledgeBridge()

class ClinicalQuery(BaseModel):
    query: str
    diagnosis: str  # e.g., "Diabetes", "Hypertension", or "Obesity"
    patient_id: str = "P101" # Default or dynamic ID

@app.get("/")
async def root():
    return {"message": "Praxia5Chronic Graph Engine is Online", "status": "Ready"}

@app.post("/ask-ai")
async def ask_ai(request: ClinicalQuery):
    """
    Orchestrates the GraphRAG process:
    1. Looks up the 'Triangle of Trust' in Neo4j for the diagnosis.
    2. Passes the Research/Dataset context to Med42.
    3. Returns a grounded, cited answer.
    """
    try:
        # We use the reasoning logic that pulls Team Research + Team Datasets
        answer = reason_with_sources(request.query, request.diagnosis)
        
        return {
            "answer": answer,
            "diagnosis_context": request.diagnosis,
            "status": "Success",
            "engine": "PJKG-GraphRAG (Med42 + Neo4j)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph Engine Error: {str(e)}")

if __name__ == "__main__":
    # Runs the engine on port 8080 to avoid conflict with Django (8000)
    uvicorn.run(app, host="0.0.0.0", port=8080)