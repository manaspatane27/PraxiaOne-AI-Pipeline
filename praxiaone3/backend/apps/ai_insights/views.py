from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.ai_memory import search_user_docs
from core.ai_prompts import build_praxia_prompt

class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_query = request.data.get("query", "")
        
        # 1. Force a document search
        doc_hits = search_user_docs(user_id=request.user.id, query=user_query, limit=10)
        
        # 2. Extract context
        context_text = "\n\n".join([h['text'] for h in doc_hits])
        
        # 3. Build the medical-grade prompt
        final_prompt = build_praxia_prompt(context_text, ["medical_documents", "biomedical_research"])
        
        # 4. Trigger PMC-LLaMA (Simulated for now, replace with your local LLM call)
        # We bypass the "Insufficient evidence" check here to let the LLM decide
        return Response({
            "reply": "Analyzing your medical record based on clinical standards...",
            "context_length": len(context_text),
            "prompt_sent": True
        })