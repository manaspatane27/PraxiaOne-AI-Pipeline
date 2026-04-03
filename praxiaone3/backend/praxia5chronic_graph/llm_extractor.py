import requests
import json

SYSTEM_PROMPT = """
You are a medical knowledge graph extraction engine[cite: 305].
Return strictly valid JSON aligned with our ontology[cite: 306].
Identify: Diagnosis (name, icd10), Symptoms, and Causal links (CAUSED_BY)[cite: 308, 325].
"""

def extract_from_text(text):
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "med42", 
        "prompt": f"{SYSTEM_PROMPT}\n\nInput: {text}",
        "stream": False,
        "format": "json"
    }
    
    response = requests.post(url, json=payload)
    return json.loads(response.json()['response']) # [cite: 350]