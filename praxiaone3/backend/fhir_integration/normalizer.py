import logging

logger = logging.getLogger(__name__)


class FHIRNormalizer:
    """Normalize FHIR R4 resources into clinical data structures"""

    @staticmethod
    def extract_observation(resource):
        """Extract normalized observation data from FHIR Observation"""
        try:
            code_text = resource.get('code', {}).get('text', '')
            if not code_text and resource.get('code', {}).get('coding'):
                code_text = resource['code']['coding'][0].get('display', '')

            value = None
            unit = None
            if resource.get('valueQuantity'):
                value = resource['valueQuantity'].get('value')
                unit = resource['valueQuantity'].get('unit')

            return {
                'code': code_text,
                'value': value,
                'unit': unit,
                'effective': resource.get('effectiveDateTime') or resource.get('effectiveInstant'),
                'status': resource.get('status', 'unknown')
            }
        except Exception as e:
            logger.error(f"Failed to extract observation: {e}")
            return None

    @staticmethod
    def extract_condition(resource):
        """Extract normalized condition data from FHIR Condition"""
        try:
            code_text = resource.get('code', {}).get('text', '')
            if not code_text and resource.get('code', {}).get('coding'):
                code_text = resource['code']['coding'][0].get('display', '')

            return {
                'condition': code_text,
                'status': resource.get('clinicalStatus', {}).get('coding', [{}])[0].get('code', 'unknown'),
                'severity': resource.get('severity', {}).get('text', 'unknown'),
                'onset': resource.get('onsetDateTime')
            }
        except Exception as e:
            logger.error(f"Failed to extract condition: {e}")
            return None

    @staticmethod
    def extract_medication(resource):
        """Extract normalized medication data from FHIR MedicationRequest"""
        try:
            medication_ref = resource.get('medicationReference', {})
            display = medication_ref.get('display', 'Unknown Medication')

            dosage = []
            for d in resource.get('dosageInstruction', []):
                dosage.append({
                    'text': d.get('text', ''),
                    'timing': d.get('timing', {})
                })

            return {
                'medication': display,
                'status': resource.get('status', 'unknown'),
                'intent': resource.get('intent', 'unknown'),
                'dosage': dosage,
                'authored': resource.get('authoredOn')
            }
        except Exception as e:
            logger.error(f"Failed to extract medication: {e}")
            return None

    @staticmethod
    def extract_allergy(resource):
        """Extract normalized allergy data from FHIR AllergyIntolerance"""
        try:
            substance = resource.get('code', {}).get('text', '')
            if not substance and resource.get('code', {}).get('coding'):
                substance = resource['code']['coding'][0].get('display', '')

            reactions = []
            for r in resource.get('reaction', []):
                severity = r.get('severity', 'unknown')
                manifestations = [m.get('text', '') for m in r.get('manifestation', [])]
                reactions.append({
                    'severity': severity,
                    'manifestations': manifestations
                })

            return {
                'substance': substance,
                'status': resource.get('clinicalStatus', {}).get('coding', [{}])[0].get('code', 'unknown'),
                'type': resource.get('type', 'allergy'),
                'reactions': reactions
            }
        except Exception as e:
            logger.error(f"Failed to extract allergy: {e}")
            return None
