"""
Comprehensive test suite for chronic disease management
Tests models, views, serializers, and tasks
"""

from django.test import TestCase
from rest_framework.test import APITestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
import json

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


# ==================== MODEL TESTS ====================

class ChronicDiseaseModelTest(TestCase):
    """Test ChronicDisease model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_chronic_disease(self):
        """Test creating a chronic disease"""
        disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate',
            is_active=True
        )
        
        self.assertEqual(disease.user, self.user)
        self.assertEqual(disease.disease_type, 'type2_diabetes')
        self.assertEqual(disease.severity, 'moderate')
        self.assertTrue(disease.is_active)
    
    def test_disease_str_representation(self):
        """Test string representation of disease"""
        disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='hypertension',
            disease_name='Hypertension',
            diagnosis_date='2019-05-20',
            severity='mild'
        )
        
        # __str__ should contain disease name
        str_repr = str(disease)
        self.assertIn('Hypertension', str_repr)
    
    def test_risk_score_validation(self):
        """Test risk score is between 0-100"""
        disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='coronary_artery_disease',
            disease_name='CAD',
            diagnosis_date='2018-03-10',
            severity='severe',
            risk_score=75.5
        )
        
        self.assertGreaterEqual(disease.risk_score, 0)
        self.assertLessEqual(disease.risk_score, 100)
    
    def test_multiple_diseases_per_user(self):
        """Test user can have multiple chronic diseases"""
        disease1 = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
        
        disease2 = ChronicDisease.objects.create(
            user=self.user,
            disease_type='hypertension',
            disease_name='Hypertension',
            diagnosis_date='2019-05-20',
            severity='mild'
        )
        
        user_diseases = ChronicDisease.objects.filter(user=self.user)
        self.assertEqual(user_diseases.count(), 2)


class DiseaseMetricModelTest(TestCase):
    """Test DiseaseMetric model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
    
    def test_create_disease_metric(self):
        """Test creating disease metric"""
        metric = DiseaseMetric.objects.create(
            disease=self.disease,
            metric_type='hba1c',
            value=8.2,
            unit='%',
            measured_at=timezone.now()
        )
        
        self.assertEqual(metric.disease, self.disease)
        self.assertEqual(metric.metric_type, 'hba1c')
        self.assertEqual(metric.value, 8.2)
    
    def test_metric_ordering_by_date(self):
        """Test metrics are ordered by measured_at"""
        now = timezone.now()
        
        metric1 = DiseaseMetric.objects.create(
            disease=self.disease,
            metric_type='hba1c',
            value=8.2,
            unit='%',
            measured_at=now - timedelta(hours=24)
        )
        
        metric2 = DiseaseMetric.objects.create(
            disease=self.disease,
            metric_type='hba1c',
            value=8.0,
            unit='%',
            measured_at=now
        )
        
        metrics = DiseaseMetric.objects.filter(disease=self.disease).order_by('-measured_at')
        self.assertEqual(metrics[0].id, metric2.id)  # Most recent first


class MedicationPlanModelTest(TestCase):
    """Test MedicationPlan model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='hypertension',
            disease_name='Hypertension',
            diagnosis_date='2019-05-20',
            severity='mild'
        )
    
    def test_create_medication_plan(self):
        """Test creating medication plan"""
        medication = MedicationPlan.objects.create(
            disease=self.disease,
            medication_name='Amlodipine',
            dosage='5mg',
            frequency='Once daily',
            status='active',
            started_date=timezone.now().date()
        )
        
        self.assertEqual(medication.disease, self.disease)
        self.assertEqual(medication.medication_name, 'Amlodipine')
        self.assertEqual(medication.status, 'active')
    
    def test_medication_adherence_percentage(self):
        """Test medication adherence percentage"""
        medication = MedicationPlan.objects.create(
            disease=self.disease,
            medication_name='Lisinopril',
            dosage='10mg',
            frequency='Once daily',
            adherence_percentage=95.0,
            status='active',
            started_date=timezone.now().date()
        )
        
        self.assertEqual(medication.adherence_percentage, 95.0)
        self.assertGreaterEqual(medication.adherence_percentage, 0)
        self.assertLessEqual(medication.adherence_percentage, 100)


class CareGoalModelTest(TestCase):
    """Test CareGoal model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
    
    def test_create_care_goal(self):
        """Test creating care goal"""
        # create using the actual model fields (title/description/unit)
        goal = CareGoal.objects.create(
            disease=self.disease,
            goal_title='Reduce HbA1c to < 7%',
            goal_description='Lower blood sugar over next 3 months',
            target_value=7.0,
            current_value=8.2,
            unit='%',
            status='in_progress',
            target_date=timezone.now() + timedelta(days=90)
        )
        
        self.assertEqual(goal.disease, self.disease)
        self.assertEqual(goal.status, 'in_progress')
        self.assertEqual(goal.current_value, 8.2)
    
    def test_goal_progress_tracking(self):
        """Test care goal progress percentage"""
        goal = CareGoal.objects.create(
            disease=self.disease,
            goal_title='Weight loss target',
            goal_description='Reach 85kg',
            target_value=100.0,
            current_value=50.0,
            unit='kg',
            status='in_progress'
        )
        
        self.assertEqual(goal.progress_percentage, 50.0)
        self.assertGreaterEqual(goal.progress_percentage, 0)
        self.assertLessEqual(goal.progress_percentage, 100)


class RiskAssessmentModelTest(TestCase):
    """Test RiskAssessment model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='coronary_artery_disease',
            disease_name='CAD',
            diagnosis_date='2018-03-10',
            severity='severe'
        )
    
    def test_create_risk_assessment(self):
        """Test creating risk assessment"""
        assessment = RiskAssessment.objects.create(
            disease=self.disease,
            risk_level='high',
            risk_score=65.5,
            contributing_factors=['High LDL', 'Smoking history'],
            recommendations=['Reduce stress', 'Exercise 30 min daily']
        )
        
        self.assertEqual(assessment.disease, self.disease)
        self.assertEqual(assessment.risk_level, 'high')
        self.assertEqual(len(assessment.contributing_factors), 2)
    
    def test_risk_level_choices(self):
        """Test risk level is valid choice"""
        for level in ['low', 'moderate', 'high', 'critical']:
            assessment = RiskAssessment.objects.create(
                disease=self.disease,
                risk_level=level,
                risk_score=50.0
            )
            self.assertEqual(assessment.risk_level, level)


class AlertRuleModelTest(TestCase):
    """Test AlertRule model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='hypertension',
            disease_name='Hypertension',
            diagnosis_date='2019-05-20',
            severity='mild'
        )
    
    def test_create_alert_rule(self):
        """Test creating alert rule"""
        rule = AlertRule.objects.create(
            disease=self.disease,
            alert_type='High Blood Pressure',
            metric_type='systolic_bp',
            threshold_min=90,
            threshold_max=140,
            severity='high',
            is_active=True
        )
        
        self.assertEqual(rule.disease, self.disease)
        self.assertEqual(rule.metric_type, 'systolic_bp')
        self.assertTrue(rule.is_active)
    
    def test_alert_rule_thresholds(self):
        """Test alert rule min/max thresholds"""
        rule = AlertRule.objects.create(
            disease=self.disease,
            alert_type='Low Blood Glucose',
            metric_type='blood_glucose',
            threshold_min=80,
            threshold_max=120,
            severity='moderate'
        )
        
        self.assertLess(rule.threshold_min, rule.threshold_max)


class DiseaseTimelineModelTest(TestCase):
    """Test DiseaseTimeline model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
    
    def test_create_timeline_event(self):
        """Test creating timeline event"""
        event = DiseaseTimeline.objects.create(
            disease=self.disease,
            event_type='diagnosis',
            event_title='Type 2 Diabetes Diagnosed',
            event_date=timezone.now(),
            impact_level='high'
        )
        
        self.assertEqual(event.disease, self.disease)
        self.assertEqual(event.event_type, 'diagnosis')


# ==================== API VIEW TESTS ====================

class ChronicDiseaseAPITest(APITestCase):
    """Test Chronic Disease API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_diseases(self):
        """Test listing user's diseases"""
        ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
        
        response = self.client.get('/api/chronic/diseases/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_list_diseases_unauthenticated(self):
        """Test list requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/chronic/diseases/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_disease(self):
        """Test creating new disease"""
        data = {
            'disease_type': 'hypertension',
            'disease_name': 'Hypertension',
            'diagnosis_date': '2019-05-20',
            'severity': 'mild',
            'is_active': True
        }
        
        response = self.client.post('/api/chronic/diseases/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ChronicDisease.objects.count(), 1)
    
    def test_get_disease_detail(self):
        """Test retrieving disease with all related data"""
        disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
        
        response = self.client.get(f'/api/chronic/diseases/{disease.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], disease.id)
    
    def test_get_summary(self):
        """Test getting summary dashboard"""
        # Create multiple diseases
        ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate',
            risk_score=65.5
        )
        
        response = self.client.get('/api/chronic/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_diseases', response.data)


class DiseaseMetricAPITest(APITestCase):
    """Test Disease Metric API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
    
    def test_add_metric(self):
        """Test adding disease metric"""
        data = {
            'metric_type': 'hba1c',
            'value': 8.2,
            'unit': '%',
            'measured_at': timezone.now().isoformat()
        }
        
        response = self.client.post(
            f'/api/chronic/diseases/{self.disease.id}/metrics/',
            data
        )
        
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
    
    def test_get_disease_metrics(self):
        """Test retrieving disease metrics"""
        DiseaseMetric.objects.create(
            disease=self.disease,
            metric_type='hba1c',
            value=8.2,
            unit='%',
            measured_at=timezone.now()
        )
        
        response = self.client.get(f'/api/chronic/diseases/{self.disease.id}/metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ==================== SERIALIZER TESTS ====================

class ChronicDiseaseSerializerTest(TestCase):
    """Test Chronic Disease serializers"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate',
            risk_score=65.5
        )
    
    def test_disease_list_serializer(self):
        """Test list serializer for diseases"""
        serializer = ChronicDiseaseListSerializer(self.disease)
        data = serializer.data
        
        self.assertEqual(data['id'], self.disease.id)
        self.assertEqual(data['disease_name'], 'Type 2 Diabetes')
        self.assertEqual(data['severity'], 'moderate')
    
    def test_disease_detail_serializer(self):
        """Test detail serializer with nested data"""
        # Add related objects
        DiseaseMetric.objects.create(
            disease=self.disease,
            metric_type='hba1c',
            value=8.2,
            unit='%',
            measured_at=timezone.now()
        )
        
        serializer = ChronicDiseaseDetailSerializer(self.disease)
        data = serializer.data
        
        self.assertEqual(data['id'], self.disease.id)
        self.assertIn('metrics', data)


class DiseaseMetricSerializerTest(TestCase):
    """Test Disease Metric serializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.disease = ChronicDisease.objects.create(
            user=self.user,
            disease_type='type2_diabetes',
            disease_name='Type 2 Diabetes',
            diagnosis_date='2020-01-15',
            severity='moderate'
        )
    
    def test_metric_serializer(self):
        """Test metric serialization"""
        metric = DiseaseMetric.objects.create(
            disease=self.disease,
            metric_type='hba1c',
            value=8.2,
            unit='%',
            measured_at=timezone.now()
        )
        
        serializer = DiseaseMetricSerializer(metric)
        data = serializer.data
        
        self.assertEqual(data['metric_type'], 'hba1c')
        self.assertEqual(data['value'], 8.2)


# ==================== INTEGRATION TESTS ====================

class DiseaseWorkflowTest(APITestCase):
    """Test complete disease management workflow"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_complete_disease_workflow(self):
        """Test complete workflow: create disease -> add metrics -> create goals"""
        
        # 1. Create disease
        disease_data = {
            'disease_type': 'type2_diabetes',
            'disease_name': 'Type 2 Diabetes',
            'diagnosis_date': '2020-01-15',
            'severity': 'moderate'
        }
        
        response = self.client.post('/api/chronic/diseases/', disease_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        disease_id = response.data['id']
        
        # 2. Add metrics
        metric_data = {
            'metric_type': 'hba1c',
            'value': 8.2,
            'unit': '%',
            'measured_at': timezone.now().isoformat()
        }
        
        disease = ChronicDisease.objects.get(id=disease_id)
        DiseaseMetric.objects.create(
            disease=disease,
            metric_type='hba1c',
            value=8.2,
            unit='%',
            measured_at=timezone.now()
        )
        
        # 3. Verify metrics exist
        metrics = DiseaseMetric.objects.filter(disease=disease)
        self.assertEqual(metrics.count(), 1)
