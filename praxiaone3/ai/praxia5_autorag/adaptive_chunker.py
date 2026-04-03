import re

class AdaptiveChunker:
    def __init__(self, max_tokens=600):
        self.max_tokens = max_tokens

    def chunk(self, text: str):
        sections = re.split(r"\n{2,}", text)
        chunks = []

        for sec in sections:
            if len(sec) > self.max_tokens:
                chunks.extend(self._split_semantic(sec))
            else:
                chunks.append(sec)

        return chunks

    def _split_semantic(self, text):
        sentences = re.split(r'(?<=[.!?]) +', text)
        buffer = ""
        chunks = []

        for s in sentences:
            if len(buffer) + len(s) > self.max_tokens:
                chunks.append(buffer)
                buffer = s
            else:
                buffer += " " + s

        if buffer:
            chunks.append(buffer)

        return chunks
