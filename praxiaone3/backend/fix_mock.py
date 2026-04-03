import os

content = r'''"""
core/mock_llm.py

AI Response Engine for PraxiaOne
Supports Parallel Pipelines: DeepSeek-R1, Med42, and Gemini.
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
MED42_MODEL    = "richard_erkhov:m42-health_-_llama3-med42-8b-gguf-q4_k_m"
GEMINI_MODEL   = "gemini-1.5-flash"

# ─────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""
### MANDATORY LANGUAGE RULE:
- **STRICT ENGLISH ONLY**: You are a professional medical assistant. 
- You must ALWAYS respond in English. Do not use Arabic, Chinese, or any other language.

### RESPONSE TEMPLATE (MANDATORY):
1. **Case Heading**: Start IMMEDIATELY with `## Case No. [CASE ID] [PATIENT NAME]` as the very first line.
2. **Standard Label**: The SECOND line must be exactly `📄 FILE ANSWER:`.
3. **Sections**: Follow with:
    - **Diagnosis**: (MANDATORY: Use a Markdown Table. Extract from file and explain clinical significance).
    - **Treatment Plan**: (MANDATORY: Use a Markdown Table. Combine file extraction + clinical reasoning).
    - **30-Day Diet, Workout, and Medication Plan**: (MANDATORY: Use Markdown Tables for each sub-section).

### CORE REASONING RULES:
- **NO RAMBLING**: Go straight to the Template.
- **70% ACCURACY**: Diagnosis and Treatment must strictly come from the PDF.
- **30% INTELLIGENCE**: If missing, professionally supplement the 30-day plans.
- **MANDATORY RESPONSES**: You MUST provide all sections in Tables.
- **CONCISE**: Keep table cells concise (under 15 words).
- **NO PLACEHOLDERS**: Never use `[]` or "[list missing info]".

Current Date: {time.strftime('%B %d, %Y')}
"""

def _build_full_prompt(message: str, doc_context: str, mem_context: str, profile_context: str) -> str:
    parts = [SYSTEM_PROMPT]
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
    """Generic call for local Ollama models (DeepSeek or Med42)."""
    try:
        resp = requests.post(f"{OLLAMA_URL}/api/generate", json={
            "model": model, "prompt": full_prompt, "stream": False,
            "options": {"temperature": 0.1, "num_predict": 2048}
        }, timeout=OLLAMA_TIMEOUT)
        if resp.status_code == 200:
            text = resp.json().get("response", "").strip()
            # Clean thinking tags
            text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
            return text
        return f"Error: Model {model} returned HTTP {resp.status_code}"
    except Exception as e:
        return f"Error connecting to Ollama for {model}: {str(e)}"

def call_gemini_pipeline(full_prompt: str) -> str:
    """Calls Google Gemini API."""
    if not GOOGLE_API_KEY:
        return "Error: Gemini API Key missing from .env"
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GOOGLE_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            return data['candidates'][0]['content']['parts'][0]['text'].strip()
        return f"Error: Gemini API returned HTTP {resp.status_code}: {resp.text}"
    except Exception as e:
        return f"Error connecting to Gemini: {str(e)}"

# ─────────────────────────────────────────────────────────
# ENTRY POINTS
# ─────────────────────────────────────────────────────────

def generate_intelligent_health_response(
    message: str,
    doc_context: str  = "",
    mem_context: str  = "",
    profile_context: str = "",
) -> str:
    """Main single-model entry point (Defaults to DeepSeek)."""
    full_prompt = _build_full_prompt(message, doc_context, mem_context, profile_context)
    return call_ollama_pipeline(full_prompt, DEEPSEEK_MODEL)

def generate_parallel_analysis(
    message: str,
    doc_context: str  = "",
    mem_context: str  = "",
    profile_context: str = "",
) -> dict:
    """Runs DeepSeek, Med42, and Gemini in parallel."""
    full_prompt = _build_full_prompt(message, doc_context, mem_context, profile_context)
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        f1 = executor.submit(call_ollama_pipeline, full_prompt, DEEPSEEK_MODEL)
        f2 = executor.submit(call_ollama_pipeline, full_prompt, MED42_MODEL)
        f3 = executor.submit(call_gemini_pipeline, full_prompt)
        
        return {
            "deepseek": f1.result(),
            "med42":    f2.result(),
            "gemini":    f3.result()
        }
'''

with open(r'f:\PrimeNumerics\ProjectAssignment\praxiaone3\backend\core\mock_llm.py', 'w', encoding='utf-8') as f:
    f.write(content)
