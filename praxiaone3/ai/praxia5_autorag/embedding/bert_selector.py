from sentence_transformers import SentenceTransformer

class BERTSelector:
    MODELS = {
        "biobert": "pritamdeka/BioBERT-mnli-snli-scinli",
        "pubmed": "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract",
        "minilm": "all-MiniLM-L6-v2"
    }

    def select(self, domain="general"):
        if domain == "radiology":
            return SentenceTransformer(self.MODELS["biobert"])
        if domain == "research":
            return SentenceTransformer(self.MODELS["pubmed"])
        return SentenceTransformer(self.MODELS["minilm"])
