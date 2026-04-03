from django.urls import path
from .views import (
    FHIRAccountView,
    SyncFHIRView,
    FHIRResourcesView,
)

app_name = 'fhir_integration'

urlpatterns = [
    path('account/', FHIRAccountView.as_view(), name='fhir-account'),
    path('sync/', SyncFHIRView.as_view(), name='fhir-sync'),
    path('resources/', FHIRResourcesView.as_view(), name='fhir-resources'),
]
