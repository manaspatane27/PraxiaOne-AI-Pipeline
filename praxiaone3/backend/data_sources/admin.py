from django.contrib import admin
from .models import WearableDevice, HealthMetric, WearableSyncLog


@admin.register(WearableDevice)
class WearableDeviceAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'device_name', 'is_active', 'last_sync']
    list_filter = ['provider', 'is_active', 'created_at']
    search_fields = ['user__username', 'device_name']
    readonly_fields = ['created_at', 'updated_at', 'last_sync']


@admin.register(HealthMetric)
class HealthMetricAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric_type', 'value', 'unit', 'recorded_at']
    list_filter = ['metric_type', 'recorded_at']
    search_fields = ['user__username']
    readonly_fields = ['ingested_at']
    
    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ['user', 'metric_type', 'value', 'unit']
        return self.readonly_fields


@admin.register(WearableSyncLog)
class WearableSyncLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'device', 'status', 'metrics_synced', 'started_at']
    list_filter = ['status', 'started_at', 'device__provider']
    search_fields = ['user__username']
    readonly_fields = ['started_at', 'completed_at']
