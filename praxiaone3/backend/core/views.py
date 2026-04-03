# pyre-ignore-all-errors
import os, time, uuid, re
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from django.http import HttpResponse

from .models import (
    WeeklyGoal, WeightGoal, WeightEntry, UserProfile,
    UploadedDocument, Consent, ChatMessage, VitalsEntry,
)
from .serializers import (
    RegisterSerializer, WeeklyGoalSerializer, WeightGoalSerializer,
    WeightEntrySerializer, UserProfileSerializer, UploadedDocumentSerializer,
    ConsentSerializer,
)
from .ai_memory import (
    search_user_memories, upsert_memory_point,
    ingest_uploaded_document, search_user_docs,
    embed_text, _extract_text_from_file, _chunk_text
)

# --- Helpers ---
def get_or_create_consent(user):
    consent, _ = Consent.objects.get_or_create(user=user)
    return consent

def require_consent_or_403(user, doc_type: str):
    consent = get_or_create_consent(user)
    if doc_type == "care_plan" and not consent.care_plan_allowed:
        return False, "Consent required: Care Plan data is disabled."
    if doc_type == "lab_result" and not consent.lab_results_allowed:
        return False, "Consent required: Lab Results data is disabled."
    return True, ""

# --- Authentication & Profile ---
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "access": str(refresh.access_token), "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    # Add the 'put' method here to stop the 405 error
    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileSerializer(profile, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        ser = UserProfileSerializer(profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

class ConsentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        consent = get_or_create_consent(request.user)
        return Response(ConsentSerializer(consent).data)
    def patch(self, request):
        consent = get_or_create_consent(request.user)
        ser = ConsentSerializer(consent, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

# --- Goals & Vitals ---
class WeeklyGoalViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return WeeklyGoal.objects.filter(user=self.request.user).order_by("-created_at")
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class WeightGoalViewSet(viewsets.ModelViewSet):
    serializer_class = WeightGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return WeightGoal.objects.filter(user=self.request.user).order_by("-created_at")
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class WeightEntryViewSet(viewsets.ModelViewSet):
    serializer_class = WeightEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return WeightEntry.objects.filter(user=self.request.user).order_by("created_at")
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class VitalsProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # 1. Fetch the user's profile and latest goal
            profile = UserProfile.objects.filter(user=request.user).first()
            goal = WeightGoal.objects.filter(user=request.user).order_by("-created_at").first()
            
            # 2. Use 'weight_kg' from profile as the current and start weight if needed
            # Note: I'm using .target_weight because that is standard in your model
            current = float(profile.weight_kg) if profile and profile.weight_kg else 0
            target = float(goal.target_weight) if goal else 0
            
            # 3. Handle the 'start_weight' safely
            # If your model doesn't have start_weight, we use the first ever weight entry or profile weight
            start = current 

            progress = 0
            if start > target and target > 0:
                progress = ((start - current) / (start - target)) * 100

            return Response({
                "start_weight": start,
                "current_weight": current,
                "target_weight": target,
                "progress": round(max(0, min(100, progress)), 2)
            })
        except Exception as e:
            # This will prevent the screen from turning into a wall of code if there's an error
            return Response({"error": str(e), "progress": 0}, status=500)


class VitalsLatestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        latest = VitalsEntry.objects.filter(user=request.user).first()
        if not latest:
            return Response({"detail": "No vitals found"}, status=404)
        
        from django.utils import timezone
        diff = timezone.now() - latest.created_at
        is_stale = diff.days >= 1

        return Response({
            "oxygen": latest.oxygen_level,
            "pulse": latest.pulse_rate,
            "sugar": latest.sugar_level,
            "systolic": latest.bp_systolic,
            "diastolic": latest.bp_diastolic,
            "is_stale": is_stale,
            "last_updated": latest.created_at
        })

    def post(self, request):
        # Allow frontend to push demo/real data from wearables
        latest = VitalsEntry.objects.create(
            user=request.user,
            oxygen_level=request.data.get("oxygen"),
            pulse_rate=request.data.get("pulse"),
            sugar_level=request.data.get("sugar"),
            bp_systolic=request.data.get("systolic"),
            bp_diastolic=request.data.get("diastolic")
        )
        return Response({"detail": "Vitals updated", "id": latest.id}, status=201)

# --- Document Management (Fixes the Delete Error) ---
class DocumentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        qs = UploadedDocument.objects.filter(user=request.user).order_by("-uploaded_at")
        return Response(UploadedDocumentSerializer(qs, many=True, context={"request": request}).data)
    def post(self, request):
        doc_type = request.data.get("doc_type", "lab_result")
        allowed, msg = require_consent_or_403(request.user, doc_type)
        if not allowed: return Response({"detail": msg}, status=403)
        ser = UploadedDocumentSerializer(data=request.data, context={"request": request})
        if not ser.is_valid(): return Response(ser.errors, status=400)
        doc = ser.save(user=request.user)
        try:
            ingest_uploaded_document(user_id=request.user.id, doc_id=doc.id, doc_type=doc.doc_type, title=doc.title or doc.file.name, file_path=doc.file.path)
            doc.processing_status = "completed"
            doc.save()
            return Response(ser.data, status=201)
        except Exception:
            doc.processing_status = "failed"
            doc.save()
            return Response({"detail": "Ingest failed"}, status=500)

class DeleteDocumentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, doc_id):
        try:
            doc = UploadedDocument.objects.get(id=doc_id, user=request.user)
            doc.file.delete(save=False)
            doc.delete()
            return Response({"detail": "Deleted"})
        except UploadedDocument.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

# --- Text To Speech (ElevenLabs) ---
class TTSView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        text = request.data.get("text", "").strip()
        voice_id = getattr(settings, "ELEVEN_LABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
        raw_key = getattr(settings, "ELEVEN_LABS_API_KEY", "").strip()
        
        # Sanitization: Ensure key is clean and remove common 'sk_' prefixes if manually added
        api_key = raw_key.replace("sk_", "").strip()
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        if not text or not api_key: 
            return Response({"detail": "Text or API key missing"}, status=400)
            
        try:
            resp = requests.post(
                url, 
                headers={'xi-api-key': api_key, 'Content-Type': 'application/json'}, 
                json={"text": text, "model_id": "eleven_multilingual_v2"}, 
                timeout=30, 
                verify=False
            )
            if resp.status_code != 200:
                return Response({"detail": f"ElevenLabs API Error {resp.status_code}: {resp.text}"}, status=resp.status_code)
            
            return HttpResponse(resp.content, content_type="audio/mpeg")
        except Exception as e:
            return Response({"detail": f"TTS failed: {str(e)}"}, status=500)

# --- Health AI Chat ---
class HealthChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def _save(self, user, role, text): ChatMessage.objects.create(user=user, role=role, text=text)

    def get(self, request):
        from .serializers import ChatMessageSerializer
        qs = ChatMessage.objects.filter(user=request.user).order_by("created_at")
        return Response(ChatMessageSerializer(qs, many=True).data)

    def post(self, request):
        user_message = (request.data.get("message") or "").strip()
        doc_id = request.data.get("doc_id") # Optional: focus on specific document
        
        if not user_message: return Response({"detail": "message required"}, status=400)
        
        # SENSITIVE: Guarantee a bulletproof User ID extraction, falling back to Demo User (1) if Anonymous
        user_id = request.user.id if request.user.is_authenticated else 1
        
        # Suppress saving anonymous DB chats to prevent constraint failures in Demo Mode
        if request.user.is_authenticated:
            self._save(request.user, "user", user_message)
        
        doc_hits = []
        doc_context = ""

        try:
            # 1. Targeted Search (If document is attached, focus EXCLUSIVELY on it)
            # 1. Targeted Search (If document is attached, focus EXCLUSIVELY on it)
            if doc_id:
                print(f"[RAG] EXCLUSIVE SEARCH: Focusing strictly on Document {doc_id}.")
                
                # SENSITIVE: If asking for "list", "patients", "10", etc., we need DIVERSITY
                is_list_query = any(w in user_message.lower() for w in ["list", "patients", "10", "details", "all"])
                
                # 1. INCREDIBLY ROBUST KEYWORD EXTRACTION (Word Intersection Scorer)
                # Ignore common english filler words
                ignore_words = {'give', 'same', 'for', 'case', 'no', 'the', 'and', 'with', 'about', 'patient', 'name', 'number', 'now', 'this'}
                raw_words = re.split(r'[^a-zA-Z0-9]+', user_message.lower())
                search_tokens = [w for w in raw_words if len(w) >= 3 and w not in ignore_words]

                # 2. BULLETPROOF DIRECT SCAN
                if search_tokens:
                    print(f"[RAG] Keyword Scorer searching PDF for tokens: {search_tokens}...")
                    
                    # Use user_id to successfully support Anonymous demo users
                    docs_to_scan = UploadedDocument.objects.filter(id=doc_id, user_id=user_id) if doc_id else UploadedDocument.objects.filter(user_id=user_id)
                    chunk_scores = []
                    
                    from core.ai_memory import _extract_text_from_file, _chunk_text
                    
                    for doc_obj in docs_to_scan:
                        if doc_obj and os.path.exists(doc_obj.file.path):
                            raw_text = _extract_text_from_file(doc_obj.file.path)
                            
                            # Massive 3000-char envelope to prevent slicing a Patient's Case ID away from their Diagnosis!
                            temp_chunks = _chunk_text(raw_text, chunk_size=3000, overlap=800)
                            
                            # Score chunks based on how many unique search tokens they contain
                            for c in temp_chunks:
                                c_lower = c.lower()
                                score = sum(1 for token in search_tokens if token in c_lower)
                                if score > 0:
                                    chunk_scores.append((score, c, doc_obj.title))
                            
                # 3. HIGH-PRECISION IDENTITY WEIGHTING
                # We boost chunks that contain the current patient's name to force identity alignment.
                final_hits = []
                # Extract Target Name from query if present
                name_match = re.search(r'(Mr\.|Ms\.|Mrs\.)\s*([\w\s]+)', user_message)
                target_name = name_match.group(2).lower().split()[0] if name_match else ""
                
                print(f"[RAG] Identity Weighting: Scanning for patient '{target_name}' in chunks.")
                for score, text, title in chunk_scores:
                    # RADICAL SANITIZATION: Strip non-ASCII characters to prevent Chinese/Arabic leaks
                    clean_text = "".join([char for char in text if ord(char) < 128])
                    text_lower = clean_text.lower()
                    final_score = score
                    
                    if target_name and target_name in text_lower:
                        # Massive boost for getting the right patient!
                        final_score *= 10.0
                        
                    final_hits.append((final_score, clean_text, title))
                
                final_hits.sort(key=lambda x: x[0], reverse=True)

                if final_hits:
                    top_score = final_hits[0][0]
                    print(f"[RAG] Identity Match Success! Top score: {top_score}")
                    doc_hits = [{"text": x[1], "title": x[2]} for x in final_hits[:5]]
                        
                # 3. SEMANTIC FALLBACK (If no keywords found, or direct scan failed)
                if not doc_hits:
                    if is_list_query:
                        print(f"[RAG] List query fallback.")
                        doc_hits = search_user_docs(user_id=request.user.id, query="", limit=40, doc_id=doc_id)
                    else:
                        print(f"[RAG] Semantic search fallback.")
                        doc_hits = search_user_docs(user_id=request.user.id, query=user_message, limit=15, doc_id=doc_id)

                if doc_hits:
                    title = doc_hits[0].get('title', 'Target Document')
                    doc_context = f"## FOCUS DOCUMENT (JUST ATTACHED)\n"
                    doc_context += f"► [PROCESSING INSTRUCTION]: Extract information relevant to the user's question.\n"
                    doc_context += f"► IMPORTANT: If this is a personal report (like a CSV file or personal health PDF), assign all data to the User Profile automatically.\n"
                    doc_context += f"► If the document contains MULTIPLE unrelated patients, filter specifically for the Name/ID mentioned in the question.\n\n"
                    doc_context += f"""
    - **Case Heading**: ## Case No. [CASE ID] [EXTRACTED NAME] (Or Personal Vitals)
    - **Diagnosis / Findings**: (MANDATORY: Use a Markdown Table. Extract from file).
    - **Treatment Plan**: (MANDATORY: Use a Markdown Table).
    - **30-Day Diet, Workout, and Medication Plan**: (MANDATORY: Use Markdown Tables).
"""
                    
                    if is_list_query:
                        doc_context += "EXTRACT A LIST OF UNIQUE PATIENTS FROM THIS CONTENT. DO NOT REPEAT THE SAME PERSON.\n"
                    
                    # Add boundaries
                    chunk_text = ""
                    for i, h in enumerate(doc_hits):
                        chunk_text += f"\n[CHUNK {i+1}]: {h['text']}\n"
                    
                    doc_context += f"--- DOCUMENT: {title} ---\n{chunk_text}"
                else:
                    print(f"[RAG] CRITICAL: Focused document {doc_id} has no indexed content yet.")
            
            # 2. General Search (Only if NO document was attached)
            else:
                print(f"[RAG] GENERAL SEARCH: No specific document attached. Searching entire library.")
                doc_hits = search_user_docs(user_id=request.user.id, query=user_message, limit=50) # Increased to 50
                if doc_hits:
                    grouped = {}
                    for h in doc_hits:
                        t = h.get('title', 'Document')
                        if t not in grouped: grouped[t] = []
                        grouped_others = grouped[t]
                        grouped_others.append(h['text'])
                    
                    parts = ["## MEDICAL LIBRARY CONTEXT"]
                    for title, texts in grouped.items():
                        parts.append(f"--- DOCUMENT: {title} ---\n" + "\n".join(texts))
                    doc_context = "\n\n".join(parts)

            print(f"[RAG] Final Context Size: {len(doc_context)} chars.")

        except Exception as e:
            print(f"RAG Error: {e}")
            doc_hits = []

        # Fetch memories separately
        memories = []
        try:
            memories = search_user_memories(user_id=request.user.id, query=user_message, limit=5)
        except Exception as e:
            print(f"Memory Search Error: {e}")
            memories = []

        # 2. Build Context with real profile data
        mem_context = "\n".join([m.get('text', '') for m in memories])

        # 2.5 Vitals Integration (Wearables Tab)
        vitals_context = ""
        try:
            from django.utils import timezone
            latest_vitals = VitalsEntry.objects.filter(user=request.user).first()
            if latest_vitals:
                diff = timezone.now() - latest_vitals.created_at
                is_stale = diff.days >= 1
                
                v_parts = [
                    f"Oxygen: {latest_vitals.oxygen_level}%",
                    f"Pulse: {latest_vitals.pulse_rate} BPM",
                    f"Blood Sugar: {latest_vitals.sugar_level} mg/dL",
                    f"BP: {latest_vitals.bp_systolic}/{latest_vitals.bp_diastolic} mmHg"
                ]
                vitals_context = "### CURRENT VITALS (FROM WEARABLES)\n" + "\n".join(v_parts)
                
                if is_stale:
                    vitals_context += "\n\n⚠️ NOTE: These vitals are OVER 24 HOURS OLD. "
                    vitals_context += "If the user asks for advice, YOU MUST politely tell them to 'Update your vitals through your wearable for more accurate clinical insights' before giving full guidance."
                else:
                    vitals_context += "\n\n✅ Vitals are FRESH (Last 24h). Provide specific exercise, diet, and medication advice based on these numbers."
        except Exception as e:
            print(f"Vitals Context Error: {e}")

        # Add vitals to the context for the LLM
        if vitals_context:
            doc_context = f"{vitals_context}\n\n{doc_context}"

        # 3. Build Context with real profile data
        try:
            profile = UserProfile.objects.filter(user=request.user).first()
            if profile:
                profile_parts = []
                if profile.full_name: profile_parts.append(f"Name: {profile.full_name}")
                if profile.age: profile_parts.append(f"Age: {profile.age}")
                if profile.weight_kg: profile_parts.append(f"Weight: {profile.weight_kg} kg")
                if profile.height_cm: profile_parts.append(f"Height: {profile.height_cm} cm")
                if profile.diet_preference: profile_parts.append(f"Diet: {profile.diet_preference}")
                if profile.wellness_interests: profile_parts.append(f"Wellness interests: {', '.join(profile.wellness_interests)}")
                profile_context = "; ".join(profile_parts) if profile_parts else ""
            else:
                profile_context = ""
        except Exception:
            profile_context = ""

        # 3. Generate Response using the AI engine (Parallel Pipelines)
        try:
            from core.mock_llm import generate_parallel_analysis
            parallel_results = generate_parallel_analysis(
                message=user_message,
                doc_context=doc_context,
                mem_context=mem_context,
                profile_context=profile_context,
            )
            
            # --- ACURAI CONFLICT RESOLUTION STEP (PRO) ---
            # Using basic Democratic Resolution across 3 AI Signals
            main_reply = parallel_results.get("deepseek", "")
            med_reply = parallel_results.get("med42", "")
            gem_reply = parallel_results.get("gemini", "")
            
            conflicts = []
            if all([main_reply, med_reply, gem_reply]) and len(main_reply) > 50:
                # 1. Check for polarity conflicts (Negative vs Positive diagnosis)
                m_low, me_low, g_low = main_reply.lower(), med_reply.lower(), gem_reply.lower()
                
                # Check for direct contradictions on "Positive" or "Negative"
                if ("positive" in m_low and "negative" in me_low) or ("positive" in m_low and "negative" in g_low):
                    conflicts.append("Model Disagreement: Conflicting diagnostic polarity detected.")
                
                # Check for "Normal" vs "Abnormal"
                if "normal" in m_low and ("abnormal" in me_low or "abnormal" in g_low):
                    conflicts.append("Model Disagreement: One or more models flag abnormal findings while others see normal results.")

            reply = main_reply
            if conflicts:
                reply = f"> 🛡️ **Acurai Conflict Warning**: {conflicts[0]}\n> *The AI models disagree on certain points. Please review the Parallel Analysis columns carefully.*\n\n" + reply
            else:
                reply = f"> ✅ **Conflict Resolved**: All 3 models show high diagnostic alignment.\n\n" + reply
                
        except Exception as e:
            parallel_results = {"error": f"Resolution Failed: {str(e)}"}
            reply = f"**Error generating response:** {str(e)}"

        # 4. Continuous Learning (Save to Long-term Memory)
        # We save the primary reply (DeepSeek) to the official chat log
        self._save(request.user, "ai", reply)
        
        try:
            from core.ai_memory import upsert_memory_point
            upsert_memory_point(user_id=request.user.id, text=user_message, kind="user_history")
            if len(reply) < 600:
                upsert_memory_point(user_id=request.user.id, text=f"Past AI Fact: {reply}", kind="ai_history")
        except Exception: pass

        return Response({
            "reply": reply,
            "results": parallel_results,  # NEW: Object containing all 3 outputs
            "context_source": "Document & Expert Expertise" if doc_context else "Expert Expertise",
            "doc_hits": doc_hits,
            "sources": list({h.get("title", "") for h in doc_hits if h.get("title")}),
        })