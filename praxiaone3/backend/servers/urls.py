from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view


@api_view(["GET"])
def api_root(request):
    return Response({
        "auth_token": "/api/auth/token/",
        "auth_refresh": "/api/auth/token/refresh/",
        "profile": "/api/profile/",
        "consent": "/api/consent/",
        "vitals_progress": "/api/vitals/progress/",
        "weekly_goals": "/api/weekly-goals/",
        "weight_goals": "/api/weight-goals/",
        "weight_entries": "/api/weight-entries/",
        "documents": "/api/documents/",
        "health_chat": "/api/health-chat/",
    })


urlpatterns = [
    path("admin/", admin.site.urls),

    # API root landing
    path("api/", api_root),

    # Your existing apps
    path("api/", include("api.urls")),
    path("api/", include("core.urls")),
]
