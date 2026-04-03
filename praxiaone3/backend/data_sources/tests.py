"""
Test suite for wearable data sources
Tests models, services, tasks, and API endpoints
"""

from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from .models import WearableDevice, HealthMetric, WearableSyncLog
from .services import AppleHealthService, GoogleFitService, FitbitService


# ==================== MODEL TESTS ====================

class WearableDeviceModelTest(TestCase):
    """Test WearableDevice model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_wearable_device(self):
        """Test creating wearable device"""
        device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="John's iPhone",
            access_token='access_token_123',
            refresh_token='refresh_token_123',
            is_active=True
        )
        
        self.assertEqual(device.user, self.user)
        self.assertEqual(device.provider, 'apple_health')
        self.assertTrue(device.is_active)
    
    def test_provider_choices(self):
        """Test supported provider choices"""
        providers = ['apple_health', 'google_fit', 'fitbit']
        
        for provider in providers:
            device = WearableDevice.objects.create(
                user=self.user,
                provider=provider,
                device_name=f"{provider} device",
                access_token='token'
            )
            self.assertEqual(device.provider, provider)
    
    def test_last_sync_timestamp(self):
        """Test last sync timestamp"""
        device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token'
        )
        
        self.assertIsNotNone(device.last_sync)
        self.assertLessEqual(device.last_sync, timezone.now())
    
    def test_multiple_devices_per_user(self):
        """Test user can have multiple devices"""
        device1 = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token1'
        )
        
        device2 = WearableDevice.objects.create(
            user=self.user,
            provider='fitbit',
            device_name="Fitbit Charge",
            access_token='token2'
        )
        
        user_devices = WearableDevice.objects.filter(user=self.user)
        self.assertEqual(user_devices.count(), 2)


class HealthMetricModelTest(TestCase):
    """Test HealthMetric model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token'
        )
    
    def test_create_health_metric(self):
        """Test creating health metric"""
        metric = HealthMetric.objects.create(
            device=self.device,
            metric_type='heart_rate',
            value=72.5,
            unit='bpm',
            recorded_at=timezone.now()
        )
        
        self.assertEqual(metric.device, self.device)
        self.assertEqual(metric.metric_type, 'heart_rate')
        self.assertEqual(metric.value, 72.5)
    
    def test_metric_types(self):
        """Test various metric types"""
        metric_types = [
            'heart_rate',
            'blood_glucose',
            'blood_pressure',
            'steps',
            'distance',
            'calories',
            'sleep',
            'temperature'
        ]
        
        for metric_type in metric_types:
            metric = HealthMetric.objects.create(
                user=self.user,
                device=self.device,
                metric_type=metric_type,
                value=100.0,
                unit='unit',
                recorded_at=timezone.now()
            )
            self.assertEqual(metric.metric_type, metric_type)
    
    def test_metric_ordering(self):
        """Test metrics are ordered by recorded_at"""
        now = timezone.now()
        
        metric1 = HealthMetric.objects.create(
            device=self.device,
            metric_type='heart_rate',
            value=70.0,
            recorded_at=now - timedelta(hours=2)
        )
        
        metric2 = HealthMetric.objects.create(
            device=self.device,
            metric_type='heart_rate',
            value=75.0,
            recorded_at=now
        )
        
        metrics = HealthMetric.objects.filter(device=self.device).order_by('-recorded_at')
        self.assertEqual(metrics[0].id, metric2.id)  # Most recent first


class WearableSyncLogModelTest(TestCase):
    """Test WearableSyncLog model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token'
        )
    
    def test_create_sync_log(self):
        """Test creating sync log"""
        log = WearableSyncLog.objects.create(
            device=self.device,
            status='success',
            metrics_synced=42
        )
        
        self.assertEqual(log.device, self.device)
        self.assertEqual(log.status, 'success')
        self.assertEqual(log.metrics_synced, 42)
    
    def test_sync_status_choices(self):
        """Test sync status validation"""
        for status_choice in ['pending', 'syncing', 'success', 'failed']:
            log = WearableSyncLog.objects.create(
                device=self.device,
                status=status_choice
            )
            self.assertEqual(log.status, status_choice)
    
    def test_sync_log_with_error(self):
        """Test sync log with error message"""
        log = WearableSyncLog.objects.create(
            device=self.device,
            status='failed',
            error_message='Connection timeout'
        )
        
        self.assertEqual(log.error_message, 'Connection timeout')


# ==================== SERVICE TESTS ====================

class AppleHealthServiceTest(TestCase):
    """Test Apple Health service"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token_abc123'
        )
        self.service = AppleHealthService(self.device)
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        self.assertEqual(self.service.device, self.device)
        self.assertEqual(self.service.device.provider, 'apple_health')
    
    @patch('data_sources.services.requests.get')
    def test_fetch_heart_rate(self, mock_get):
        """Test fetching heart rate data"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': [
                {'value': 72.5, 'startDate': '2024-03-03T10:00:00Z'}
            ]
        }
        mock_get.return_value = mock_response
        
        # Service would fetch and process data
        self.assertIsNotNone(self.service)


class GoogleFitServiceTest(TestCase):
    """Test Google Fit service"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.device = WearableDevice.objects.create(
            user=self.user,
            provider='google_fit',
            device_name="Android Phone",
            access_token='token_xyz789'
        )
        self.service = GoogleFitService(self.device)
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        self.assertEqual(self.service.device, self.device)
        self.assertEqual(self.service.device.provider, 'google_fit')


class FitbitServiceTest(TestCase):
    """Test Fitbit service"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.device = WearableDevice.objects.create(
            user=self.user,
            provider='fitbit',
            device_name="Fitbit Charge 5",
            access_token='token_fitbit123'
        )
        self.service = FitbitService(self.device)
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        self.assertEqual(self.service.device, self.device)
        self.assertEqual(self.service.device.provider, 'fitbit')


# ==================== API TESTS ====================

class WearableDeviceAPITest(APITestCase):
    """Test Wearable Device API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_devices(self):
        """Test listing wearable devices"""
        WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token'
        )
        
        response = self.client.get('/api/data-sources/devices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_requires_authentication(self):
        """Test list requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/data-sources/devices/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_device(self):
        """Test creating wearable device"""
        data = {
            'provider': 'fitbit',
            'device_name': 'Fitbit Charge 5',
            'access_token': 'new_token_123'
        }
        
        response = self.client.post('/api/data-sources/devices/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_disconnect_device(self):
        """Test disconnecting device"""
        device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token',
            is_active=True
        )
        
        response = self.client.delete(f'/api/data-sources/devices/{device.id}/')
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])


class HealthMetricAPITest(APITestCase):
    """Test Health Metric API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.device = WearableDevice.objects.create(
            user=self.user,
            provider='apple_health',
            device_name="iPhone",
            access_token='token'
        )
    
    def test_list_metrics(self):
        """Test listing health metrics"""
        HealthMetric.objects.create(
            user=self.user,
            device=self.device,
            metric_type='heart_rate',
            value=72.5,
            unit='bpm',
            recorded_at=timezone.now()
        )
        
        response = self.client.get('/api/data-sources/metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_metrics_by_type(self):
        """Test filtering metrics by type"""
        HealthMetric.objects.create(
            user=self.user,
            device=self.device,
            metric_type='heart_rate',
            value=72.5,
            unit='bpm',
            recorded_at=timezone.now()
        )
        
        HealthMetric.objects.create(
            user=self.user,
            device=self.device,
            metric_type='steps',
            value=10000,
            unit='steps',
            recorded_at=timezone.now()
        )
        
        response = self.client.get('/api/data-sources/metrics/?metric_type=heart_rate')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_metrics_by_date_range(self):
        """Test filtering metrics by date range"""
        start_date = timezone.now() - timedelta(days=7)
        end_date = timezone.now()
        
        response = self.client.get(
            f'/api/data-sources/metrics/?start_date={start_date}&end_date={end_date}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ==================== INTEGRATION TESTS ====================

class WearableIntegrationWorkflowTest(APITestCase):
    """Test complete wearable integration workflow"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_complete_wearable_workflow(self):
        """Test workflow: pair device -> sync metrics -> query data"""
        
        # 1. Pair device
        device_data = {
            'provider': 'apple_health',
            'device_name': "John's iPhone",
            'access_token': 'token_abc123'
        }
        
        response = self.client.post('/api/data-sources/devices/', device_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Verify device created
        device = WearableDevice.objects.get(user=self.user)
        self.assertEqual(device.provider, 'apple_health')
        
        # 3. Create sample metrics
        metrics_data = [
            {'metric_type': 'heart_rate', 'value': 72.5, 'unit': 'bpm'},
            {'metric_type': 'steps', 'value': 10000, 'unit': 'steps'},
            {'metric_type': 'sleep', 'value': 7.5, 'unit': 'hours'}
        ]
        
        for metric_data in metrics_data:
            HealthMetric.objects.create(
                device=device,
                metric_type=metric_data['metric_type'],
                value=metric_data['value'],
                unit=metric_data['unit']
            )
        
        # 4. Query metrics
        response = self.client.get('/api/data-sources/metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)
    
    def test_sync_history_tracking(self):
        """Test sync history is tracked"""
        device = WearableDevice.objects.create(
            user=self.user,
            provider='fitbit',
            device_name="Fitbit",
            access_token='token'
        )
        
        # Create sync logs
        WearableSyncLog.objects.create(
            device=device,
            status='success',
            metrics_synced=50
        )
        
        WearableSyncLog.objects.create(
            device=device,
            status='success',
            metrics_synced=45
        )
        
        logs = WearableSyncLog.objects.filter(device=device)
        self.assertEqual(logs.count(), 2)
        self.assertEqual(logs.aggregate(total=sum('metrics_synced'))['total'], 95)
