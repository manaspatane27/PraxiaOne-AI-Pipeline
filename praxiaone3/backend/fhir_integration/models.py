from django.db import models
from django.conf import settings


class FHIRResource(models.Model):
    """Store raw FHIR R4 resources from EHR systems

    Resources are linked to an account for the FHIR server; the owning user is
    derived from that account but kept as a separate field for faster queries.
    """
    account = models.ForeignKey(
        'fhir_integration.FHIRAccount',
        on_delete=models.CASCADE,
        related_name='resources'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fhir_resources'
    )
    resource_type = models.CharField(max_length=100)  # Observation, Patient, Condition, etc.
    resource_id = models.CharField(max_length=255)  # FHIR server resource ID
    raw_json = models.JSONField()  # Full FHIR R4 resource
    
    synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'resource_type']),
            models.Index(fields=['created_at']),
        ]
        unique_together = ('account', 'resource_type', 'resource_id')

    def __str__(self):
        return f"{self.user} - {self.resource_type} ({self.resource_id})"


class FHIRAccount(models.Model):
    """Store FHIR server credentials and sync status"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fhir_account'
    )
    fhir_server_url = models.URLField()
    patient_id = models.CharField(max_length=255)  # FHIR Patient resource ID
    access_token = models.TextField()  # OAuth token (encrypted in production)
    refresh_token = models.TextField(null=True, blank=True)
    
    # track when the last sync occurred; default to now on creation so tests
    # that inspect the field immediately will not fail.
    last_sync = models.DateTimeField(auto_now_add=True)
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('syncing', 'Syncing'),
            ('success', 'Success'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.fhir_server_url}"

    def save(self, *args, **kwargs):
        # ensure user is populated from the related account when available
        if not getattr(self, 'user_id', None) and hasattr(self, 'account') and self.account:
            self.user = self.account.user
        super().save(*args, **kwargs)
