import requests
from datetime import datetime, timedelta
from .models import HealthMetric, WearableSyncLog
import logging

logger = logging.getLogger(__name__)


class AppleHealthService:
    """Service to process Apple Health data from iOS app"""

    def __init__(self, device):
        # the test suite expects the service to hold a reference to the
        # wearable device it is operating on.
        self.device = device

    @staticmethod
    def ingest_metrics(user, metrics_data):
        """
        Ingest metrics from Apple Health (sent by iOS app via Flutter)
        
        Args:
            user: Django User instance
            metrics_data: List of metric dicts {metric_type, value, unit, recorded_at}
        """
        created_count = 0
        errors = []

        for metric_data in metrics_data:
            try:
                HealthMetric.objects.create(
                    user=user,
                    metric_type=metric_data['metric_type'],
                    value=float(metric_data['value']),
                    unit=metric_data['unit'],
                    recorded_at=metric_data['recorded_at']
                )
                created_count += 1
            except Exception as e:
                error_msg = f"Failed to ingest metric {metric_data.get('metric_type')}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        logger.info(f"Apple Health: {created_count} metrics ingested for user {user.id}")
        return {'created': created_count, 'errors': errors}


class GoogleFitService:
    """Service to interact with Google Fit API"""

    BASE_URL = "https://www.googleapis.com/fitness/v1/users/me"

    def __init__(self, device):
        self.device = device

    @staticmethod
    def ingest_metrics(user, metrics_data):
        """Ingest metrics from Google Fit (sent by Android app via Flutter)"""
        created_count = 0
        errors = []

        for metric_data in metrics_data:
            try:
                HealthMetric.objects.create(
                    user=user,
                    metric_type=metric_data['metric_type'],
                    value=float(metric_data['value']),
                    unit=metric_data['unit'],
                    recorded_at=metric_data['recorded_at']
                )
                created_count += 1
            except Exception as e:
                error_msg = f"Failed to ingest metric {metric_data.get('metric_type')}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        logger.info(f"Google Fit: {created_count} metrics ingested for user {user.id}")
        return {'created': created_count, 'errors': errors}

    @classmethod
    def fetch_steps(cls, access_token, days_back=1):
        """Fetch steps data from Google Fit API"""
        try:
            now = datetime.now()
            start_time = (now - timedelta(days=days_back)).timestamp() * 1000
            end_time = now.timestamp() * 1000

            headers = {"Authorization": f"Bearer {access_token}"}

            body = {
                "aggregateBy": [
                    {
                        "dataTypeName": "com.google.step_count.delta",
                        "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
                    }
                ],
                "bucketByTime": {"durationMillis": 86400000},
                "startTimeMillis": int(start_time),
                "endTimeMillis": int(end_time)
            }

            response = requests.post(
                f"{cls.BASE_URL}/dataset:aggregate",
                json=body,
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Google Fit API error: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Failed to fetch steps from Google Fit: {e}")
            return None


class FitbitService:
    """Service to interact with Fitbit API"""

    BASE_URL = "https://api.fitbit.com/1/user/-"

    def __init__(self, device):
        self.device = device

    @staticmethod
    def fetch_heart_rate(access_token):
        """Fetch heart rate data from Fitbit"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            response = requests.get(
                f"{FitbitService.BASE_URL}/activities/heart/date/today/1d.json",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                metrics = []
                
                for entry in data.get('activities-heart', []):
                    value = entry.get('value', {})
                    if 'restingHeartRate' in value:
                        metrics.append({
                            'metric_type': 'heart_rate',
                            'value': value['restingHeartRate'],
                            'unit': 'bpm',
                            'recorded_at': entry.get('dateTime')
                        })
                
                return metrics
            else:
                logger.error(f"Fitbit API error: {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"Failed to fetch heart rate from Fitbit: {e}")
            return []

    @staticmethod
    def fetch_steps(access_token):
        """Fetch steps data from Fitbit"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            response = requests.get(
                f"{FitbitService.BASE_URL}/activities/date/today.json",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                metrics = []
                
                summary = data.get('summary', {})
                if 'steps' in summary:
                    metrics.append({
                        'metric_type': 'steps',
                        'value': summary['steps'],
                        'unit': 'steps',
                        'recorded_at': data.get('dateTime')
                    })
                
                return metrics
            else:
                logger.error(f"Fitbit API error: {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"Failed to fetch steps from Fitbit: {e}")
            return []
