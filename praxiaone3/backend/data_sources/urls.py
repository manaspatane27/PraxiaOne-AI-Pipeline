from django.urls import path
from .views import (
    AppleHealthIngestView,
    GoogleFitIngestView,
    WearableDeviceView,
    WearableDeviceDetailView,
    HealthMetricsView,
    SyncWearableView,
)

app_name = 'data_sources'

urlpatterns = [
    # Apple Health endpoints
    path('apple-health/', AppleHealthIngestView.as_view(), name='apple-health-ingest'),
    
    # Google Fit endpoints
    path('google-fit/', GoogleFitIngestView.as_view(), name='google-fit-ingest'),
    
    # Wearable device management
    path('devices/', WearableDeviceView.as_view(), name='wearable-devices'),
    path('devices/<int:device_id>/', WearableDeviceDetailView.as_view(), name='wearable-device-detail'),
    
    # Health metrics retrieval
    path('metrics/', HealthMetricsView.as_view(), name='health-metrics'),
    
    # Wearable sync
    path('sync/', SyncWearableView.as_view(), name='wearable-sync'),
]
