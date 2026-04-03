from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q
from django.utils import timezone

from .models import (
    ChronicDisease,
    DiseaseMetric,
    MedicationPlan,
    CareGoal,
    RiskAssessment,
    AlertRule,
    DiseaseTimeline,
)
from .serializers import (
    ChronicDiseaseDetailSerializer,
    ChronicDiseaseListSerializer,
    DiseaseMetricSerializer,
    MedicationPlanSerializer,
    CareGoalSerializer,
    RiskAssessmentSerializer,
    AlertRuleSerializer,
    DiseaseTimelineSerializer,
)
import logging

logger = logging.getLogger(__name__)


class ChronicDiseaseListView(APIView):
    """
    List and create chronic diseases for user
    GET: List all chronic diseases
    POST: Add new chronic disease
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List user's chronic diseases"""
        diseases = ChronicDisease.objects.filter(user=request.user)
        serializer = ChronicDiseaseListSerializer(diseases, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Add new chronic disease"""
        data = request.data.copy()
        data['user'] = request.user.id
        
        serializer = ChronicDiseaseDetailSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChronicDiseaseDetailView(APIView):
    """
    Retrieve, update, or delete specific chronic disease
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, disease_id):
        """Get disease details"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            serializer = ChronicDiseaseDetailSerializer(disease)
            return Response(serializer.data)
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def put(self, request, disease_id):
        """Update disease"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            serializer = ChronicDiseaseDetailSerializer(disease, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, disease_id):
        """Delete disease"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            disease.delete()
            return Response({'status': 'Disease deleted'})
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DiseaseMetricsView(APIView):
    """
    Manage disease metrics
    GET: List metrics for a disease
    POST: Add new metric
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, disease_id):
        """Get disease metrics"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            
            # Filter by metric type if provided
            metric_type = request.query_params.get('metric_type')
            days_back = int(request.query_params.get('days', 30))
            
            from datetime import datetime, timedelta
            cutoff_date = datetime.now() - timedelta(days=days_back)
            
            metrics = disease.metrics.filter(measured_at__gte=cutoff_date)
            if metric_type:
                metrics = metrics.filter(metric_type=metric_type)
            
            metrics = metrics.order_by('-measured_at')
            serializer = DiseaseMetricSerializer(metrics, many=True)
            return Response(serializer.data)
            
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, disease_id):
        """Add new metric"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            
            data = request.data.copy()
            data['disease'] = disease.id
            
            serializer = DiseaseMetricSerializer(data=data)
            if serializer.is_valid():
                serializer.save(disease=disease)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class MedicationPlanView(APIView):
    """
    Manage medications for a disease
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, disease_id):
        """Get medications"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            medications = disease.medications.filter(status='active')
            serializer = MedicationPlanSerializer(medications, many=True)
            return Response(serializer.data)
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, disease_id):
        """Add medication"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            data = request.data.copy()
            data['disease'] = disease.id
            
            serializer = MedicationPlanSerializer(data=data)
            if serializer.is_valid():
                serializer.save(disease=disease)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class RiskAssessmentView(APIView):
    """
    Get and view risk assessments
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, disease_id):
        """Get risk assessments"""
        try:
            disease = ChronicDisease.objects.get(id=disease_id, user=request.user)
            assessments = disease.risk_assessments.order_by('-assessment_date')
            serializer = RiskAssessmentSerializer(assessments, many=True)
            return Response(serializer.data)
        except ChronicDisease.DoesNotExist:
            return Response(
                {'detail': 'Disease not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DashboardSummaryView(APIView):
    """
    Get comprehensive disease summary for dashboard
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get summary of all chronic diseases"""
        diseases = ChronicDisease.objects.filter(user=request.user, is_active=True)
        
        summary = {
            'total_diseases': diseases.count(),
            'critical_risk_count': diseases.filter(risk_score__gte=75).count(),
            'high_risk_count': diseases.filter(risk_score__gte=50, risk_score__lt=75).count(),
            'moderate_risk_count': diseases.filter(risk_score__gte=25, risk_score__lt=50).count(),
            'low_risk_count': diseases.filter(risk_score__lt=25).count(),
            'diseases': [],
        }
        
        for disease in diseases:
            # Get latest assessment
            latest_assessment = disease.risk_assessments.first()
            
            # Get active medications
            active_meds = disease.medications.filter(status='active').count()
            
            # Get pending goals
            pending_goals = disease.care_goals.exclude(status='achieved').count()
            
            disease_summary = {
                'id': disease.id,
                'disease_name': disease.disease_name,
                'severity': disease.severity,
                'risk_score': disease.risk_score,
                'active_medications': active_meds,
                'pending_goals': pending_goals,
                'latest_assessment': RiskAssessmentSerializer(latest_assessment).data if latest_assessment else None,
            }
            summary['diseases'].append(disease_summary)
        
        return Response(summary)
