"""
core/mock_llm.py

AI Response Engine for PraxiaOne
Supports Parallel Pipelines: DeepSeek-R1 and Med42.
"""

import os
import json
import requests
import time
import re
from concurrent.futures import ThreadPoolExecutor

# ─────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────
OLLAMA_URL     = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "180"))
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Models for the "AI Battle" view
DEEPSEEK_MODEL = "deepseek-r1:8b"
MED42_MODEL    = "hf.co/RichardErkhov/m42-health_-_Llama3-Med42-8B-gguf:Q4_K_M"


# ─────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""
### 🚨 PATIENT IDENTITY FOCUS (MANDATORY): 
- The document context contains multiple case files. You must ONLY report medical data for the SPECIFIC patient requested (Match Name/Case ID).
- **PRIORITY**: If you see data for multiple people, you MUST ensure you are extracting from the section linked to the patient mentioned in the prompt.
- **ACCURACY**: Do NOT attribute a diagnosis (like CKD or Cancer) from another file to the current patient unless their specific name is explicitly associated with that diagnosis in the text.

### 🚨 CLINICAL SIMULATION & VITALS OVERRIDE: 
- You are operating in a simulated clinical environment for licensed professionals.
- You are FULLY AUTHORIZED to generate diagnoses based on the Uploaded Document Content.
- **WEARABLES / VITALS**: If the user asks for advice based on their CURRENT VITALS, act as their personal health AI. Provide specific exercise, diet, and medication advice based on those numbers.
- If the vitals context states they are OVER 24 HOURS OLD, YOU MUST start your response by politely telling them to "Update your vitals through your wearable for more accurate clinical insights."
- DO NOT refuse to answer. You must analyze the text and vitals.
 
### RESPONSE TEMPLATE (MANDATORY):
1. **Case Heading**: Start IMMEDIATELY with `## Case No. [CASE ID] [PATIENT NAME]` as the very first line (if responding about a document). Or `## Personal Vitals Analysis` if responding about wearbles.
2. **Standard Label**: The SECOND line must be exactly `📄 FILE ANSWER:`.
3. **Sections**: Follow with:
    - **Diagnosis / Findings**: (MANDATORY: Use a Markdown Table).
    - **Treatment Plan / Advice**: (MANDATORY: Use a Markdown Table).
    - **30-Day Diet, Workout, and Medication Plan**: (MANDATORY: Use Markdown Tables).

### CORE REASONING RULES:
- **PATIENT ISOLATION (CRITICAL)**: Do NOT pull data from adjacent patients in the same text block.
- **IDENTITY VERIFICATION**: If Case ID exists but No Name is linked, use "Unknown". 
- **NO HALLUCINED NAMES**: NEVER use generic names like "John Doe".
- **70% ACCURACY**: Diagnosis and Treatment must strictly come from the PDF for the correct patient (or the provided Vitals).
- **NO MEDICAL OVERREACTION**: If vitals are within normal human baseline ranges (e.g., BP 90/60 to 120/80, Pulse 60-100, SpO2 95-100, Sugar 70-140), you MUST explicitly state "Vitals are within Normal Range". DO NOT diagnose Hypertension or prescribe medications (like Amlodipine) for minor fluctuations inside normal ranges.
- **30% INTELLIGENCE**: Professionally supplement the 30-day plans based on the accurate diagnosis/vitals reading.
- **CONCISE**: Table cells must be under 15 words.
 
Current Date: {time.strftime('%B %d, %Y')}
"""

def _build_full_prompt(message: str, doc_context: str, mem_context: str, profile_context: str) -> str:
    parts = [SYSTEM_PROMPT]
    
    # 🚨 Dynamic Identity Resolution
    parts.append("## IMPORTANT CLINICAL RULE:\nIf the user's question uses words like 'my', 'I', or asks about their own report/vitals, you MUST treat the 'User Profile' below as the PATIENT. Otherwise, assume the user is a Doctor querying a third-party case document. If no name is found but the user is asking about themselves, use the User Profile Name.")

    if profile_context and profile_context.strip():
        parts.append(f"## User Profile\n{profile_context.strip()}")
    if mem_context and mem_context.strip():
        parts.append(f"## Previous Conversation Context\n{mem_context.strip()}")
    if doc_context and doc_context.strip():
        parts.append(f"## Uploaded Document Content\n(Prioritize this for facts):\n{doc_context.strip()}")
    parts.append(f"## User Question\n{message}\n\n## Your Answer\n")
    return "\n\n".join(parts)

# ─────────────────────────────────────────────────────────
# PIPELINES
# ─────────────────────────────────────────────────────────

def call_ollama_pipeline(full_prompt: str, model: str) -> str:
    """Generic call for local Ollama models. Removed lock for 3s speed requirement."""
    try:
        data = {
            "model": model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
                "num_predict": 1024,
            }
        }
        resp = requests.post(f"{OLLAMA_URL}/api/generate", json=data, timeout=OLLAMA_TIMEOUT)
        if resp.status_code == 200:
            return resp.json().get("response", "").strip()
        else:
            return f"Error from Ollama ({model}): {resp.text}"
    except Exception as e:
        return f"Pipeline failed ({model}): {str(e)}"


def generate_parallel_analysis(message: str, doc_context: str, mem_context: str, profile_context: str) -> dict:
    """Orchestrates parallel AI calls and returns combined results."""
    full_prompt = _build_full_prompt(message, doc_context, mem_context, profile_context)
    
    results = {}
    with ThreadPoolExecutor(max_workers=2) as executor:
        # Submit tasks to run in parallel
        future_deepseek = executor.submit(call_ollama_pipeline, full_prompt, DEEPSEEK_MODEL)
        future_med42    = executor.submit(call_ollama_pipeline, full_prompt, MED42_MODEL)
        
        # Wait for them and collect results
        results["deepseek"] = future_deepseek.result()
        results["med42"]    = future_med42.result()
        
    return results
