import requests
from fhirpy import SyncFHIRClient
from django.conf import settings
from .models import FHIRResource, FHIRAccount
from .normalizer import FHIRNormalizer
import logging

logger = logging.getLogger(__name__)


class FHIRService:
    """Service to interact with FHIR servers (EPIC, Cerner, HAPI, etc.)"""

    def __init__(self, fhir_server_url):
        """Initialize FHIR client with server URL"""
        self.fhir_server_url = fhir_server_url
        try:
            self.client = SyncFHIRClient(fhir_server_url)
        except Exception as e:
            logger.error(f"Failed to initialize FHIR client: {e}")
            self.client = None

    def sync_patient_data(self, user, patient_id, resource_types=None):
        """
        Sync all FHIR resources for a patient
        
        Args:
            user: Django User instance
            patient_id: FHIR Patient resource ID
            resource_types: List of resource types to sync (default: all common types)
        """
        if not self.client:
            raise Exception("FHIR client not initialized")

        if resource_types is None:
            resource_types = [
                'Observation',
                'Condition',
                'MedicationRequest',
                'Procedure',
                'AllergyIntolerance',
                'DiagnosticReport',
                'Encounter',
                'CarePlan',
                'Immunization'
            ]

        synced_count = 0
        errors = []

        # attempt to locate the FHIRAccount for this user so we can link
        # resources back to it.  If no account exists, fall back to using
        # user-only but the resources will be orphaned.
        account = None
        try:
            account = FHIRAccount.objects.get(user=user)
        except FHIRAccount.DoesNotExist:
            logger.warning(f"No FHIRAccount found for user {user.id}")

        for resource_type in resource_types:
            try:
                resources = self.client.resources(resource_type).search(
                    subject=f"Patient/{patient_id}"
                ).fetch()

                from .r4_validator import FHIRR4Validator

                for resource in resources:
                    raw = resource.serialize()
                    
                    try:
                        valid_resource = FHIRR4Validator.validate(raw)
                    except ValueError as e:
                        logger.warning(f"R4 Validation skipped for {resource_type}: {e}")
                        pass
                        
                    defaults = {'raw_json': raw, 'user': user}
                    if account:
                        defaults['account'] = account

                    FHIRResource.objects.update_or_create(
                        resource_type=resource_type,
                        resource_id=resource.id,
                        defaults=defaults
                    )
                    synced_count += 1

            except Exception as e:
                error_msg = f"Failed to sync {resource_type}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        logger.info(f"User {user.id}: Synced {synced_count} FHIR resources")
        return {
            'synced': synced_count,
            'errors': errors,
            'success': len(errors) == 0
        }

    def get_observations(self, patient_id, limit=100):
        """Get all observations for a patient"""
        if not self.client:
            return []
        try:
            return self.client.resources('Observation').search(
                subject=f"Patient/{patient_id}"
            ).sort('-date').fetch(limit=limit)
        except Exception as e:
            logger.error(f"Failed to fetch observations: {e}")
            return []

    def get_conditions(self, patient_id):
        """Get all conditions for a patient"""
        if not self.client:
            return []
        try:
            return self.client.resources('Condition').search(
                subject=f"Patient/{patient_id}"
            ).fetch()
        except Exception as e:
            logger.error(f"Failed to fetch conditions: {e}")
            return []

    def get_medications(self, patient_id):
        """Get all medications for a patient"""
        if not self.client:
            return []
        try:
            return self.client.resources('MedicationRequest').search(
                subject=f"Patient/{patient_id}"
            ).fetch()
        except Exception as e:
            logger.error(f"Failed to fetch medications: {e}")
            return []


class FHIRNormalizerService:
    """Extract and normalize FHIR resources into health metrics"""

    @staticmethod
    def extract_observation(resource):
        """
        Extract observation from FHIR Observation resource
        Returns dict with normalized data
        """
        try:
            code_text = resource.code.text if hasattr(resource.code, 'text') else str(resource.code)
            
            value = None
            unit = None
            if hasattr(resource, 'valueQuantity') and resource.valueQuantity:
                value = getattr(resource.valueQuantity, 'value', None)
                unit = getattr(resource.valueQuantity, 'unit', None)
            
            effective = getattr(resource, 'effectiveDateTime', None)
            if not effective and hasattr(resource, 'effectiveInstant'):
                effective = getattr(resource, 'effectiveInstant', None)

            return {
                'code': code_text,
                'value': value,
                'unit': unit,
                'effective': effective,
                'status': getattr(resource, 'status', 'unknown')
            }
        except Exception as e:
            logger.error(f"Failed to extract observation: {e}")
            return None

    @staticmethod
    def extract_condition(resource):
        """Extract condition from FHIR Condition resource"""
        try:
            code_text = resource.code.text if hasattr(resource.code, 'text') else str(resource.code)
            
            return {
                'condition': code_text,
                'status': getattr(resource, 'clinicalStatus', {}).get('coding', [{}])[0].get('code', 'unknown'),
                'severity': getattr(resource, 'severity', {}).get('text', 'unknown'),
                'onset': getattr(resource, 'onsetDateTime', None)
            }
        except Exception as e:
            logger.error(f"Failed to extract condition: {e}")
            return None

    @staticmethod
    def extract_medication(resource):
        """Extract medication from FHIR MedicationRequest resource"""
        try:
            medication_ref = getattr(resource, 'medicationReference', {})
            display = medication_ref.get('display', 'Unknown Medication')
            
            dosage = []
            dosage_instruction = getattr(resource, 'dosageInstruction', [])
            if dosage_instruction:
                for d in dosage_instruction:
                    dosage.append({
                        'text': getattr(d, 'text', ''),
                        'timing': getattr(d, 'timing', {})
                    })

            return {
                'medication': display,
                'status': getattr(resource, 'status', 'unknown'),
                'intent': getattr(resource, 'intent', 'unknown'),
                'dosage': dosage,
                'authored': getattr(resource, 'authoredOn', None)
            }
        except Exception as e:
            logger.error(f"Failed to extract medication: {e}")
            return None
