from rest_framework import serializers
from .models import WearableDevice, HealthMetric, WearableSyncLog


class WearableDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WearableDevice
        fields = ['id', 'provider', 'device_name', 'is_active', 'last_sync']
        read_only_fields = ['id', 'last_sync']


class HealthMetricSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.device_name', read_only=True)
    device_provider = serializers.CharField(source='device.provider', read_only=True)

    class Meta:
        model = HealthMetric
        fields = [
            'id',
            'metric_type',
            'value',
            'unit',
            'value_secondary',
            'unit_secondary',
            'device_name',
            'device_provider',
            'recorded_at',
            'ingested_at'
        ]
        read_only_fields = ['id', 'ingested_at']


class WearableSyncLogSerializer(serializers.ModelSerializer):
    device_provider = serializers.CharField(source='device.provider', read_only=True)

    class Meta:
        model = WearableSyncLog
        fields = ['id', 'device_provider', 'status', 'metrics_synced', 'error_message', 'started_at', 'completed_at']
        read_only_fields = ['id', 'started_at', 'completed_at']
