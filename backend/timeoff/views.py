from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import TimeOffType, Allocation, TimeOffRequest
from .serializers import TimeOffTypeSerializer, AllocationSerializer, TimeOffRequestSerializer
from .services import submit_request, approve_step, refuse_step, TimeOffError
from approvals.services import ApprovalError


class TimeOffTypeViewSet(viewsets.ModelViewSet):
    queryset = TimeOffType.objects.all()
    serializer_class = TimeOffTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class AllocationViewSet(viewsets.ModelViewSet):
    serializer_class = AllocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Allocation.objects.select_related("employee", "time_off_type")
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs


class TimeOffRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TimeOffRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TimeOffRequest.objects.select_related("employee", "time_off_type")
        employee_id = self.request.query_params.get("employee")
        status_filter = self.request.query_params.get("status")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        obj = self.get_object()
        approver_id = request.data.get("approver_id")
        approver = None
        if approver_id:
            from accounts.models import User
            approver = User.objects.filter(pk=approver_id).first()
        try:
            submit_request(obj, approver=approver)
        except TimeOffError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(TimeOffRequestSerializer(obj).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        obj = self.get_object()
        try:
            approve_step(obj, request.user)
        except (TimeOffError, ApprovalError) as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(TimeOffRequestSerializer(obj).data)

    @action(detail=True, methods=["post"])
    def refuse(self, request, pk=None):
        obj = self.get_object()
        reason = request.data.get("reason", "")
        try:
            refuse_step(obj, request.user, reason=reason)
        except ApprovalError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(TimeOffRequestSerializer(obj).data)
