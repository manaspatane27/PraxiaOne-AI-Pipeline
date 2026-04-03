
from typing import Any

from core.llm_clients import HuggingFaceLLM

class DummyLLM:
    def generate(self, question, context):
        return "Generated answer based on provided context."


class HFWrapper:
    """Wrap a HuggingFaceLLM instance for compatibility with router."""
    def __init__(self, model_name: str = "TheBloke/PMC-LLaMA-13B-GPTQ"):
        self.client = HuggingFaceLLM(model_name=model_name)

    def generate(self, question: str, context: str) -> str:
        return self.client.generate(question, context)


class LLMRouter:
    def __init__(self):
        # choose default model from env if needed
        self.default_model = None
        try:
            # instantiate once to catch errors early
            self.default_model = HFWrapper()
        except Exception:
            self.default_model = DummyLLM()

    def route(self, query: str) -> Any:
        # currently simple: return the same model for everything
        if self.default_model:
            return self.default_model
        return DummyLLM()
