from praxia5_autorag.adaptive_chunker import AdaptiveChunker
from praxia5_autorag.embedding.bert_selector import BERTSelector
from praxia5_autorag.retrieval.vector_store import VectorStore
from praxia5_autorag.grounding.pre_validation import grounding_score
from praxia5_autorag.grounding.post_validation import validate_answer
from praxia5_autorag.llm.router import LLMRouter
from praxia5_autorag.scoring.confidence import compute_confidence
from praxia5_autorag.schemas import AutoRAGResponse


class AutoRAGEngine:

    def __init__(self):
        self.chunker = AdaptiveChunker()
        self.bert_selector = BERTSelector()
        self.vector_store = VectorStore(collection="praxiaone_health_memory")
        self.router = LLMRouter()

    def index_document(self, text, domain="general"):
        model = self.bert_selector.select(domain)
        chunks = self.chunker.chunk(text)
        embeddings = model.encode(chunks).tolist()

        payloads = [{"text": c, "domain": domain} for c in chunks]
        self.vector_store.upsert(embeddings, payloads)
        
        return len(chunks)

    def query(self, question, domain="general", retrieved_chunks=None):

        model = self.bert_selector.select(domain)
        query_emb = model.encode([question])[0]

        results = []
        if retrieved_chunks is None:
            results = self.vector_store.search(query_emb.tolist())
            retrieved_chunks = [r.payload["text"] for r in results]

        retrieved_embs = model.encode(retrieved_chunks) if retrieved_chunks else []
        g_score = grounding_score(query_emb, retrieved_embs)

        if g_score < 0.45: # Adjusted threshold for demo robustness
            return AutoRAGResponse(
                answer="Insufficient grounded evidence.",
                confidence=g_score,
                citations=[],
                grounding_score=g_score
            )

        context = "\n\n".join(retrieved_chunks)
        llm = self.router.route(question)
        llm_name = getattr(llm, 'client', None)
        if llm_name:
            llm_name = getattr(llm.client, 'model_name', str(llm))
        else:
            llm_name = str(llm)
        answer = llm.generate(question, context)

        valid = validate_answer(answer, retrieved_chunks)
        confidence = compute_confidence(g_score, valid)

        return AutoRAGResponse(
            answer=answer,
            confidence=confidence,
            citations=[str(r.id) for r in results],
            grounding_score=g_score,
            llm_name=llm_name,
        )
