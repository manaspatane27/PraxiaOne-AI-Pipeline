from celery import shared_task
from django.contrib.auth import get_user_model
from .services import FHIRService
from .models import FHIRAccount, FHIRResource
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def sync_fhir_task(self, user_id, fhir_server_url, patient_id, access_token):
    """
    Async task to sync FHIR data from server
    Retries up to 3 times on failure
    """
    try:
        user = User.objects.get(id=user_id)
        fhir_account = FHIRAccount.objects.get(user=user)
        
        # Update sync status
        fhir_account.sync_status = 'syncing'
        fhir_account.save()
        
        # Initialize FHIR service and sync
        service = FHIRService(fhir_server_url)
        result = service.sync_patient_data(user, patient_id)
        
        if result['success']:
            fhir_account.sync_status = 'success'
            logger.info(f"FHIR sync successful for user {user_id}: {result['synced']} resources")
        else:
            fhir_account.sync_status = 'failed'
            logger.error(f"FHIR sync failed for user {user_id}: {result['errors']}")
        
        fhir_account.save()
        return result
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {'success': False, 'error': 'User not found'}
    except Exception as exc:
        logger.error(f"FHIR sync error: {exc}")
        # Retry after 60 seconds
        raise self.retry(exc=exc, countdown=60)


@shared_task
def index_fhir_data_task(user_id):
    """
    Index synced FHIR data into AutoRAG/Qdrant
    Called after successful FHIR sync
    """
    try:
        from praxia_ai.praxia5_autorag import AutoRAGEngine
        
        user = User.objects.get(id=user_id)
        resources = FHIRResource.objects.filter(user=user)
        
        # Prepare text for indexing
        text_chunks: list = []
        for resource in resources:
            resource_json = resource.raw_json
            text = f"FHIR Resource ({resource.resource_type}): {str(resource_json)}"
            text_chunks.append(text)
        
        if not text_chunks:
            logger.info(f"No FHIR resources to index for user {user_id}")
            return
        
        combined_text = "\n\n".join(text_chunks)
        
        logger.info(f"Indexing {len(text_chunks)} FHIR resources using AutoRAG Engine for user {user_id}")
        engine = AutoRAGEngine()
        
        # Index everything as a single logical document block for the Engine to segment
        engine.index_document(combined_text, domain="general")
        
    except Exception as e:
        logger.error(f"Failed to index FHIR data: {e}")
