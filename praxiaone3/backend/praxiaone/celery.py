"""
Celery configuration for Praxia5Chronic
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'praxiaone.settings')

app = Celery('praxiaone')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered apps
app.autodiscover_tasks()

# Optional: Configure periodic tasks
app.conf.beat_schedule = {
    'cleanup-old-metrics': {
        'task': 'data_sources.tasks.cleanup_old_metrics',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
