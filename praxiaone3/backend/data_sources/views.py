from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import WearableDevice, HealthMetric, WearableSyncLog
from .services import AppleHealthService, GoogleFitService
from .serializers import WearableDeviceSerializer, HealthMetricSerializer
import logging

logger = logging.getLogger(__name__)


class AppleHealthIngestView(APIView):
    """
    Ingest health metrics from Apple Health (iOS)
    POST: Submit batch of metrics
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Ingest Apple Health metrics"""
        metrics = request.data.get('metrics', [])
        
        if not metrics:
            return Response(
                {'detail': 'No metrics provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = AppleHealthService.ingest_metrics(request.user, metrics)

        return Response({
            'status': 'success',
            'created': result['created'],
            'errors': result['errors']
        })


class GoogleFitIngestView(APIView):
    """
    Ingest health metrics from Google Fit (Android)
    POST: Submit batch of metrics
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Ingest Google Fit metrics"""
        metrics = request.data.get('metrics', [])
        
        if not metrics:
            return Response(
                {'detail': 'No metrics provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = GoogleFitService.ingest_metrics(request.user, metrics)

        return Response({
            'status': 'success',
            'created': result['created'],
            'errors': result['errors']
        })


class WearableDeviceView(APIView):
    """
    Manage wearable device connections
    GET: List all devices
    POST: Add new device
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List user's wearable devices"""
        devices = WearableDevice.objects.filter(user=request.user, is_active=True)
        serializer = WearableDeviceSerializer(devices, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Link a new wearable device"""
        serializer = WearableDeviceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WearableDeviceDetailView(APIView):
    """
    Update or delete device
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, device_id):
        """Disconnect a wearable device"""
        try:
            device = WearableDevice.objects.get(id=device_id, user=request.user)
            device.is_active = False
            device.save()
            return Response({'status': 'Device disconnected'})
        except WearableDevice.DoesNotExist:
            return Response(
                {'detail': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class HealthMetricsView(APIView):
    """
    Retrieve health metrics
    GET: List metrics with filters
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get health metrics for user"""
        metric_type = request.query_params.get('metric_type')
        days_back = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 100))
        
        from datetime import datetime, timedelta
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        queryset = HealthMetric.objects.filter(
            user=request.user,
            recorded_at__gte=cutoff_date
        )
        
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        queryset = queryset.order_by('-recorded_at')[:limit]
        
        serializer = HealthMetricSerializer(queryset, many=True)
        return Response(serializer.data)


class SyncWearableView(APIView):
    """
    Trigger wearable device sync
    POST: Start async sync
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Trigger wearable sync"""
        device_id = request.data.get('device_id')
        
        try:
            device = WearableDevice.objects.get(id=device_id, user=request.user)
        except WearableDevice.DoesNotExist:
            return Response(
                {'detail': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Import here to avoid circular imports
        if device.provider in ['fitbit', 'garmin']:
            from .tasks import sync_fitbit_task
            task = sync_fitbit_task.delay(
                user_id=request.user.id,
                device_id=device_id
            )
        else:
            return Response(
                {'detail': f'Auto-sync not available for {device.provider}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'status': 'Sync started',
            'task_id': task.id
        })
