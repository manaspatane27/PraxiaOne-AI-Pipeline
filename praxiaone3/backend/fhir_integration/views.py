from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import FHIRAccount, FHIRResource
from .services import FHIRService
from .serializers import FHIRAccountSerializer, FHIRResourceSerializer
import logging

logger = logging.getLogger(__name__)


class FHIRAccountView(APIView):
    """
    Manage FHIR server account connection
    POST: Link FHIR account
    GET: Get current FHIR account
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Link a new FHIR account"""
        serializer = FHIRAccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Get user's FHIR account details"""
        try:
            fhir_account = FHIRAccount.objects.get(user=request.user)
            serializer = FHIRAccountSerializer(fhir_account)
            return Response(serializer.data)
        except FHIRAccount.DoesNotExist:
            return Response(
                {'detail': 'No FHIR account linked'},
                status=status.HTTP_404_NOT_FOUND
            )


class SyncFHIRView(APIView):
    """
    Trigger FHIR data sync (will be called by Celery task)
    POST: Start async sync
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Trigger FHIR data sync"""
        try:
            fhir_account = FHIRAccount.objects.get(user=request.user)
        except FHIRAccount.DoesNotExist:
            return Response(
                {'detail': 'No FHIR account linked'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Import here to avoid circular imports with Celery
        from .tasks import sync_fhir_task
        
        # Trigger async task
        task = sync_fhir_task.delay(
            user_id=request.user.id,
            fhir_server_url=fhir_account.fhir_server_url,
            patient_id=fhir_account.patient_id,
            access_token=fhir_account.access_token
        )

        return Response({
            'status': 'FHIR sync started',
            'task_id': task.id
        })


class FHIRResourcesView(APIView):
    """
    Retrieve synced FHIR resources
    GET: List all resources for user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all FHIR resources for current user"""
        resource_type = request.query_params.get('resource_type')
        
        queryset = FHIRResource.objects.filter(user=request.user)
        
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        queryset = queryset.order_by('-synced_at')
        
        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        total = queryset.count()
        resources = queryset[offset:offset + limit]
        
        serializer = FHIRResourceSerializer(resources, many=True)
        
        return Response({
            'count': total,
            'limit': limit,
            'offset': offset,
            'results': serializer.data
        })
