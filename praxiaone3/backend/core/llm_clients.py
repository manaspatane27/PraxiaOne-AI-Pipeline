# backend/core/llm_clients.py
"""Simple wrapper for using a free HuggingFace model for inference.
This is intended as a fallback when OpenAI credentials are not available.
We pick PMC-LLaMA-13B by default (open weights, good medical accuracy).
"""

from typing import Optional

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    _hf_available = True
except ImportError:
    _hf_available = False


class HuggingFaceLLM:
    def __init__(self, model_name: str = "TheBloke/PMC-LLaMA-13B-GPTQ"):
        if not _hf_available:
            raise RuntimeError("transformers not installed")
        # load tokenizer and model lazily
        self.model_name = model_name
        self._pipe: Optional[pipeline] = None

    def _ensure_pipeline(self):
        if self._pipe is None:
            # use text-generation pipeline with 4bit quantized model if available
            self._pipe = pipeline(
                "text-generation",
                model=self.model_name,
                device_map="auto",
                trust_remote_code=True,
                torch_dtype="auto",
                max_length=2048,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
            )
    def generate(self, question: str, context: str) -> str:
        self._ensure_pipeline()
        # Clean and concise system prompt
        system = """You are an advanced medical AI assistant using PMC-LLaMA-13B.
1. Analyze uploaded medical documents thoroughly
2. Extract and discuss biomarkers, findings, and clinical significance
3. Use medical knowledge from PubMed and clinical guidelines
4. Provide structured, evidence-based analysis
5. Always cite document findings when available
"""
        
        # Build efficient prompt
        context_part = f"\n[DOCUMENT CONTEXT]\n{context}" if context.strip() else ""
        prompt = f"{system}\n[USER QUESTION]\n{question}{context_part}\n\n[ANALYSIS]\n"
        
        try:
            out = self._pipe(prompt, return_full_text=False, max_length=512)
            if isinstance(out, list) and len(out) > 0:
                text = out[0].get("generated_text", "").strip()
                if text:
                    return text
        except Exception as e:
            print(f"HF LLM error: {e}")
        
        return ""
