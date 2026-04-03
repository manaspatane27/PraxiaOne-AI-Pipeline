from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import RegisterView

# Prometheus exports may not be installed in lightweight test environments
try:
    from django_prometheus import exports
    _prometheus_available = True
except ImportError:
    _prometheus_available = False

urlpatterns = [
    path("admin/", admin.site.urls),

    # DRF browsable login/logout
    path("api/auth/", include("rest_framework.urls")),

    # Register endpoint
    path("api/auth/register/", RegisterView.as_view(), name="auth-register"),

    # JWT auth endpoints
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Your APIs
    path("api/", include("core.urls")),
    
    # FHIR Integration
    path("api/fhir/", include("fhir_integration.urls")),
    
    # Data Sources (Wearables)
    path("api/data-sources/", include("data_sources.urls")),
    
    # Chronic Disease Management
    path("api/chronic/", include("chronic_mgmt.urls")),
    
    # Prometheus Metrics (only if package available)
]

if _prometheus_available:
    urlpatterns += [
        path("metrics/", exports.ExportToDjangoView, name='prometheus-metrics'),
    ]

# reopen urlpatterns list for following conditional registration
urlpatterns += []

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)