from django.urls import path
from .views import (
    ChronicDiseaseListView,
    ChronicDiseaseDetailView,
    DiseaseMetricsView,
    MedicationPlanView,
    RiskAssessmentView,
    DashboardSummaryView,
)

app_name = 'chronic_mgmt'

urlpatterns = [
    # Chronic disease management
    path('diseases/', ChronicDiseaseListView.as_view(), name='disease-list'),
    path('diseases/<int:disease_id>/', ChronicDiseaseDetailView.as_view(), name='disease-detail'),
    
    # Disease metrics
    path('diseases/<int:disease_id>/metrics/', DiseaseMetricsView.as_view(), name='disease-metrics'),
    
    # Medications
    path('diseases/<int:disease_id>/medications/', MedicationPlanView.as_view(), name='medications'),
    
    # Risk assessments
    path('diseases/<int:disease_id>/risk/', RiskAssessmentView.as_view(), name='risk-assessment'),
    
    # Dashboard summary
    path('summary/', DashboardSummaryView.as_view(), name='summary'),
]
