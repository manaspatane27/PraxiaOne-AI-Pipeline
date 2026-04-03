from rest_framework import serializers
from .models import FHIRAccount, FHIRResource


class FHIRAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FHIRAccount
        fields = ['id', 'fhir_server_url', 'patient_id', 'sync_status', 'last_sync']
        read_only_fields = ['sync_status', 'last_sync']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FHIRResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FHIRResource
        fields = ['id', 'resource_type', 'resource_id', 'synced_at', 'created_at']
        read_only_fields = ['id', 'synced_at', 'created_at']
