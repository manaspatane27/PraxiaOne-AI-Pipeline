from django.contrib import admin
from .models import FHIRResource, FHIRAccount


@admin.register(FHIRAccount)
class FHIRAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'fhir_server_url', 'patient_id', 'sync_status', 'last_sync']
    list_filter = ['sync_status', 'created_at']
    search_fields = ['user__username', 'patient_id']
    readonly_fields = ['created_at', 'updated_at', 'last_sync']


@admin.register(FHIRResource)
class FHIRResourceAdmin(admin.ModelAdmin):
    list_display = ['user', 'resource_type', 'resource_id', 'synced_at']
    list_filter = ['resource_type', 'synced_at']
    search_fields = ['user__username', 'resource_id']
    readonly_fields = ['created_at', 'synced_at']
