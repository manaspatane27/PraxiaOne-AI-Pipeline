from django.db import models
from django.conf import settings
from django.utils import timezone


class WearableDevice(models.Model):
    """Store wearable device credentials (Apple Health, Google Fit, Fitbit, etc.)"""
    PROVIDER_CHOICES = [
        ('apple_health', 'Apple Health'),
        ('google_fit', 'Google Fit'),
        ('fitbit', 'Fitbit'),
        ('garmin', 'Garmin'),
        ('oura', 'Oura Ring'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wearable_devices'
    )
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    device_name = models.CharField(max_length=255, blank=True)
    
    access_token = models.TextField()  # Encrypted in production
    refresh_token = models.TextField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'provider')

    def __str__(self):
        return f"{self.user} - {self.get_provider_display()}"


class HealthMetric(models.Model):
    """Store aggregated health metrics from wearables"""
    METRIC_TYPES = [
        ('heart_rate', 'Heart Rate'),
        ('blood_pressure', 'Blood Pressure'),
        ('oxygen_saturation', 'Oxygen Saturation'),
        ('blood_glucose', 'Blood Glucose'),
        ('steps', 'Steps'),
        ('sleep', 'Sleep'),
        ('weight', 'Weight'),
        ('body_temperature', 'Body Temperature'),
        ('respiratory_rate', 'Respiratory Rate'),
        ('ecg', 'ECG'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='health_metrics'
    )
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    value = models.FloatField()
    unit = models.CharField(max_length=50)  # bpm, mmHg, mg/dL, steps, etc.
    
    # Optional secondary value (e.g., for BP: systolic/diastolic)
    value_secondary = models.FloatField(null=True, blank=True)
    unit_secondary = models.CharField(max_length=50, blank=True)
    
    # The wearable device that produced this metric.  Earlier versions called this
    # `source_device` but the tests and other code expect simply `device`.
    device = models.ForeignKey(
        WearableDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='metrics'
    )
    
    # When the metric was recorded; test helpers often omit it so default
    # to now to avoid NOT NULL errors during creation.
    recorded_at = models.DateTimeField(default=timezone.now)
    ingested_at = models.DateTimeField(auto_now_add=True)  # When we received it

    class Meta:
        indexes = [
            models.Index(fields=['user', 'metric_type', 'recorded_at']),
            models.Index(fields=['recorded_at']),
        ]
        ordering = ['-recorded_at']

    def save(self, *args, **kwargs):
        # if user not provided but device is set, infer owner from device
        # use user_id to avoid RelatedObjectDoesNotExist when user is unset
        if not getattr(self, 'user_id', None) and self.device:
            # device should already have a user relationship
            self.user = self.device.user
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.metric_type}: {self.value} {self.unit}"


class WearableSyncLog(models.Model):
    """Log of wearable sync operations for debugging"""
    SYNC_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('syncing', 'Syncing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wearable_sync_logs'
    )
    device = models.ForeignKey(
        WearableDevice,
        on_delete=models.CASCADE,
        related_name='sync_logs'
    )
    
    status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default='pending')
    metrics_synced = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # infer user from device if missing; check user_id to prevent related error
        if not getattr(self, 'user_id', None) and self.device:
            self.user = self.device.user
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.device.provider} - {self.status}"
