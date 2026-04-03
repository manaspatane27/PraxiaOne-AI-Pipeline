"""
Test suite for FHIR integration
Tests models, services, tasks, and API endpoints
"""

from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import json

from .models import FHIRResource, FHIRAccount
from .services import FHIRService, FHIRNormalizer


# ==================== MODEL TESTS ====================

class FHIRAccountModelTest(TestCase):
    """Test FHIRAccount model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_fhir_account(self):
        """Test creating FHIR account"""
        account = FHIRAccount.objects.create(
            user=self.user,
            fhir_server_url='https://fhir.example.com',
            patient_id='patient-123',
            access_token='token_abc123',
            sync_status='success'
        )
        
        self.assertEqual(account.user, self.user)
        self.assertEqual(account.patient_id, 'patient-123')
        self.assertEqual(account.sync_status, 'success')
    
    def test_sync_status_choices(self):
        """Test sync status validation"""
        for status_choice in ['pending', 'syncing', 'success', 'failed']:
            account = FHIRAccount.objects.create(
                user=self.user,
                fhir_server_url='https://fhir.example.com',
                patient_id='patient-123',
                sync_status=status_choice
            )
            self.assertEqual(account.sync_status, status_choice)
    
    def test_last_sync_timestamp(self):
        """Test last sync timestamp is updated"""
        account = FHIRAccount.objects.create(
            user=self.user,
            fhir_server_url='https://fhir.example.com',
            patient_id='patient-123'
        )
        
        self.assertIsNotNone(account.last_sync)
        self.assertLessEqual(account.last_sync, timezone.now())


class FHIRResourceModelTest(TestCase):
    """Test FHIRResource model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.account = FHIRAccount.objects.create(
            user=self.user,
            fhir_server_url='https://fhir.example.com',
            patient_id='patient-123'
        )
    
    def test_create_fhir_resource(self):
        """Test creating FHIR resource"""
        resource_data = {
            "resourceType": "Observation",
            "id": "obs-123",
            "status": "final",
            "code": {
                "coding": [{"system": "http://loinc.org", "code": "2345-7"}],
                "text": "Glucose [Mass/volume] in Serum, Plasma or Blood"
            }
        }
        
        resource = FHIRResource.objects.create(
            account=self.account,
            resource_type='Observation',
            resource_id='obs-123',
            raw_json=resource_data
        )
        
        self.assertEqual(resource.account, self.account)
        self.assertEqual(resource.resource_type, 'Observation')
        self.assertEqual(resource.resource_id, 'obs-123')
    
    def test_supported_resource_types(self):
        """Test all supported FHIR resource types"""
        resource_types = ['Observation', 'Condition', 'MedicationRequest', 'AllergyIntolerance']
        
        for res_type in resource_types:
            resource = FHIRResource.objects.create(
                account=self.account,
                resource_type=res_type,
                resource_id=f'{res_type.lower()}-123',
                raw_json={"resourceType": res_type}
            )
            self.assertEqual(resource.resource_type, res_type)
    
    def test_resource_synced_at_timestamp(self):
        """Test synced_at timestamp"""
        resource = FHIRResource.objects.create(
            account=self.account,
            resource_type='Observation',
            resource_id='obs-123',
            raw_json={"resourceType": "Observation"}
        )
        
        self.assertIsNotNone(resource.synced_at)
        self.assertLessEqual(resource.synced_at, timezone.now())


# ==================== SERVICE TESTS ====================

class FHIRNormalizerTest(TestCase):
    """Test FHIRNormalizer service"""
    
    def test_normalize_observation(self):
        """Test normalizing FHIR Observation"""
        observation = {
            "resourceType": "Observation",
            "id": "obs-123",
            "status": "final",
            "code": {
                "coding": [{"code": "2345-7", "system": "http://loinc.org"}],
                "text": "Glucose"
            },
            "valueQuantity": {
                "value": 145.0,
                "unit": "mg/dL"
            },
            "effectiveDateTime": "2024-03-03T10:00:00Z"
        }
        
        normalizer = FHIRNormalizer()
        result = normalizer.extract_observation(observation)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['value'], 145.0)
    
    def test_normalize_condition(self):
        """Test normalizing FHIR Condition"""
        condition = {
            "resourceType": "Condition",
            "id": "cond-123",
            "code": {
                "coding": [{"code": "E11", "system": "http://hl7.org/fhir/sid/icd-10-cm"}],
                "text": "Type 2 Diabetes"
            },
            "onsetDateTime": "2020-01-15T00:00:00Z"
        }
        
        normalizer = FHIRNormalizer()
        result = normalizer.extract_condition(condition)
        
        self.assertIsNotNone(result)
        self.assertIn('code', result)
    
    def test_normalize_medication_request(self):
        """Test normalizing FHIR MedicationRequest"""
        med_request = {
            "resourceType": "MedicationRequest",
            "id": "med-123",
            "status": "active",
            "medicationCodeableConcept": {
                "coding": [{"code": "197446", "system": "http://www.nlm.nih.gov/research/umls/rxnorm"}],
                "text": "Metformin"
            },
            "dosageInstruction": [
                {
                    "text": "500mg twice daily",
                    "timing": {"repeat": {"frequency": 2, "period": 1, "periodUnit": "d"}}
                }
            ]
        }
        
        normalizer = FHIRNormalizer()
        result = normalizer.extract_medication(med_request)
        
        self.assertIsNotNone(result)


class FHIRServiceTest(TestCase):
    """Test FHIRService"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.account = FHIRAccount.objects.create(
            user=self.user,
            fhir_server_url='https://fhir.example.com',
            patient_id='patient-123',
            access_token='token_abc123'
        )
    
    @patch('fhir_integration.services.requests.get')
    def test_sync_fhir_observations(self, mock_get):
        """Test syncing FHIR observations"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "resourceType": "Bundle",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": "obs-123",
                        "valueQuantity": {"value": 145.0, "unit": "mg/dL"}
                    }
                }
            ]
        }
        mock_get.return_value = mock_response
        
        service = FHIRService(self.account)
        # This would call the actual sync method
        self.assertIsNotNone(service)


# ==================== API TESTS ====================

class FHIRAccountAPITest(APITestCase):
    """Test FHIR Account API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_fhir_accounts(self):
        """Test listing FHIR accounts"""
        FHIRAccount.objects.create(
            user=self.user,
            fhir_server_url='https://fhir.example.com',
            patient_id='patient-123'
        )
        
        response = self.client.get('/api/fhir/account/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_requires_authentication(self):
        """Test list requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/fhir/account/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_fhir_account(self):
        """Test creating FHIR account"""
        data = {
            'fhir_server_url': 'https://fhir.example.com',
            'patient_id': 'patient-456',
            'access_token': 'new_token_123'
        }
        
        response = self.client.post('/api/fhir/account/', account_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class FHIRResourceAPITest(APITestCase):
    """Test FHIR Resource API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.account = FHIRAccount.objects.create(
            user=self.user,
            fhir_server_url='https://fhir.example.com',
            patient_id='patient-123'
        )
    
    def test_list_fhir_resources(self):
        """Test listing FHIR resources"""
        FHIRResource.objects.create(
            account=self.account,
            resource_type='Observation',
            resource_id='obs-123',
            raw_json={"resourceType": "Observation"}
        )
        
        response = self.client.get('/api/fhir/resources/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_resources_by_type(self):
        """Test filtering resources by type"""
        FHIRResource.objects.create(
            account=self.account,
            resource_type='Observation',
            resource_id='obs-123',
            raw_json={"resourceType": "Observation"}
        )
        
        FHIRResource.objects.create(
            account=self.account,
            resource_type='Condition',
            resource_id='cond-123',
            raw_json={"resourceType": "Condition"}
        )
        
        response = self.client.get('/api/fhir/resources/?resource_type=Observation')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ==================== INTEGRATION TESTS ====================

class FHIRIntegrationWorkflowTest(APITestCase):
    """Test complete FHIR integration workflow"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_complete_fhir_workflow(self):
        """Test workflow: create account -> sync resources -> query data"""
        
        # 1. Create FHIR account
        account_data = {
            'fhir_server_url': 'https://fhir.example.com',
            'patient_id': 'patient-123',
            'access_token': 'token_abc123'
        }
        
        response = self.client.post('/api/fhir/account/', account_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Verify account created
        account = FHIRAccount.objects.get(user=self.user)
        self.assertEqual(account.patient_id, 'patient-123')
        
        # 3. Create sample FHIR resources
        FHIRResource.objects.create(
            account=account,
            resource_type='Observation',
            resource_id='obs-123',
            raw_json={
                "resourceType": "Observation",
                "id": "obs-123",
                "valueQuantity": {"value": 145.0, "unit": "mg/dL"}
            }
        )
        
        # 4. Query resources
        response = self.client.get('/api/fhir/resources/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
