from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .models import TimeOffType, Allocation, TimeOffRequest
from .serializers import TimeOffTypeSerializer, AllocationSerializer, TimeOffRequestSerializer
from .services import approve_request, refuse_request


class TimeOffTypeViewSet(viewsets.ModelViewSet):
    queryset = TimeOffType.objects.all()
    serializer_class = TimeOffTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class AllocationViewSet(viewsets.ModelViewSet):
    queryset = Allocation.objects.all()
    serializer_class = AllocationSerializer
    permission_classes = [permissions.IsAuthenticated]


class TimeOffRequestViewSet(viewsets.ModelViewSet):
    queryset = TimeOffRequest.objects.all()
    serializer_class = TimeOffRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        req = self.get_object()
        try:
            approve_request(req)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(TimeOffRequestSerializer(req).data)

    @action(detail=True, methods=["post"])
    def refuse(self, request, pk=None):
        req = self.get_object()
        try:
            refuse_request(req)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(TimeOffRequestSerializer(req).data)