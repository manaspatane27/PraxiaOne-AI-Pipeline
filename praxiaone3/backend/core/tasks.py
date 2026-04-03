# backend/core/tasks.py
import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from core.models import UploadedDocument
from core.ai_memory import ingest_uploaded_document

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def async_ingest_uploaded_document(user_id: int, doc_id: int, doc_type: str, title: str, file_path: str):
    """
    Celery task to asynchronously read an uploaded document, embed it, 
    and store it in Qdrant via the AutoRAG engine.
    """
    try:
        logger.info(f"Starting async ingestion for doc_id={doc_id}, user={user_id}, type={doc_type}")
        
        # Ingest
        result = ingest_uploaded_document(
            user_id=user_id,
            doc_id=doc_id,
            doc_type=doc_type,
            title=title,
            file_path=file_path
        )
        
        logger.info(f"Successfully ingrained document doc_id={doc_id} with {len(result.get('chunks', []))} chunks.")
        
        # Update the document processing status
        try:
            doc = UploadedDocument.objects.get(id=doc_id)
            doc.processing_status = "completed"
            doc.raw_text_extracted = "Indexed to Qdrant AutoRAG engine."
            doc.save()
        except UploadedDocument.DoesNotExist:
            logger.warning(f"UploadedDocument id={doc_id} not found after indexing.")

        return result
    except Exception as e:
        logger.error(f"Error during async doc ingestion: {str(e)}")
        try:
            doc = UploadedDocument.objects.get(id=doc_id)
            doc.processing_status = "failed"
            doc.raw_text_extracted = f"Error: {str(e)}"
            doc.save()
        except UploadedDocument.DoesNotExist:
            pass
        raise e
