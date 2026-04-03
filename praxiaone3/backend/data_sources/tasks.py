from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import WearableDevice, WearableSyncLog, HealthMetric
from .services import FitbitService
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def sync_fitbit_task(self, user_id, device_id):
    """
    Async task to sync Fitbit data
    """
    try:
        user = User.objects.get(id=user_id)
        device = WearableDevice.objects.get(id=device_id, user=user)
        
        # Create sync log
        sync_log = WearableSyncLog.objects.create(
            user=user,
            device=device,
            status='syncing'
        )
        
        # Fetch and ingest metrics
        heart_rate_metrics = FitbitService.fetch_heart_rate(device.access_token)
        steps_metrics = FitbitService.fetch_steps(device.access_token)
        
        all_metrics = heart_rate_metrics + steps_metrics
        created_count = 0
        
        for metric in all_metrics:
            try:
                HealthMetric.objects.create(
                    user=user,
                    metric_type=metric['metric_type'],
                    value=float(metric['value']),
                    unit=metric['unit'],
                    recorded_at=metric['recorded_at'],
                    device=device
                )
                created_count += 1
            except Exception as e:
                logger.error(f"Failed to create metric: {e}")
        
        # Update device last_sync
        device.last_sync = timezone.now()
        device.save()
        
        # Update sync log
        sync_log.status = 'success'
        sync_log.metrics_synced = created_count
        sync_log.completed_at = timezone.now()
        sync_log.save()
        
        logger.info(f"Fitbit sync success for user {user_id}: {created_count} metrics")
        return {'success': True, 'metrics_synced': created_count}
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {'success': False, 'error': 'User not found'}
    except WearableDevice.DoesNotExist:
        logger.error(f"Device {device_id} not found")
        return {'success': False, 'error': 'Device not found'}
    except Exception as exc:
        logger.error(f"Fitbit sync error: {exc}")
        try:
            sync_log.status = 'failed'
            sync_log.error_message = str(exc)
            sync_log.completed_at = timezone.now()
            sync_log.save()
        except:
            pass
        
        raise self.retry(exc=exc, countdown=60)


@shared_task
def index_health_metrics_task(user_id):
    """
    Index health metrics into AutoRAG/Qdrant for AI grounding
    """
    try:
        from datetime import datetime, timedelta
        
        user = User.objects.get(id=user_id)
        
        # Get recent metrics (last 7 days)
        cutoff = datetime.now() - timedelta(days=7)
        metrics = HealthMetric.objects.filter(
            user=user,
            recorded_at__gte=cutoff
        ).order_by('-recorded_at')
        
        if not metrics.exists():
            logger.info(f"No metrics to index for user {user_id}")
            return
        
        # Prepare text for indexing
        text_chunks = []
        for metric in metrics:
            text = f"{metric.get_metric_type_display()}: {metric.value} {metric.unit} at {metric.recorded_at}"
            text_chunks.append(text)
        
        combined_text = "\n".join(text_chunks)
        
        # Would index into AutoRAG here
        logger.info(f"Indexed {len(text_chunks)} health metrics for user {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to index health metrics: {e}")
