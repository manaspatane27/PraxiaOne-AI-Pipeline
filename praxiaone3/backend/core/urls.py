# backend/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .ai_memory import QdrantHealthView, QdrantUpsertDemo, QdrantSearchView

from .views import (
    WeeklyGoalViewSet,
    WeightGoalViewSet,
    WeightEntryViewSet,
    ProfileView,
    ConsentView,
    VitalsProgressView,
    VitalsLatestView,
    DocumentsView,
    DeleteDocumentView,
    HealthChatView,
    TTSView,
)

router = DefaultRouter()
router.register(r"weekly-goals", WeeklyGoalViewSet, basename="weekly-goals")
router.register(r"weight-goals", WeightGoalViewSet, basename="weight-goals")
router.register(r"weight-entries", WeightEntryViewSet, basename="weight-entries")

urlpatterns = [
    path("", include(router.urls)),

    path("profile/", ProfileView.as_view()),
    path("consent/", ConsentView.as_view()),
    path("vitals/progress/", VitalsProgressView.as_view()),
    path("vitals/latest/", VitalsLatestView.as_view(), name="vitals-latest"),

    path("documents/", DocumentsView.as_view()),
    path("documents/<int:doc_id>/delete/", DeleteDocumentView.as_view()),

    path("health-chat/", HealthChatView.as_view()),
    path("tts/", TTSView.as_view()),

    # Qdrant debug endpoints
    path("qdrant/health/", QdrantHealthView.as_view(), name="qdrant-health"),
    path("ai/qdrant-upsert-demo/", QdrantUpsertDemo.as_view()),
    path("ai/qdrant-search/", QdrantSearchView.as_view()),
]
