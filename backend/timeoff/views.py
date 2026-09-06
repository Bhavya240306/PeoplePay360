from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from accounts.models import UserProfile
from accounts.permissions import IsHRManagerOrAbove, IsEmployeeRole
from .models import TimeOffType, Allocation, TimeOffRequest
from .serializers import TimeOffTypeSerializer, AllocationSerializer, TimeOffRequestSerializer
from .services import approve_request, refuse_request, submit_request, cancel_request


class TimeOffTypeViewSet(viewsets.ModelViewSet):
    queryset = TimeOffType.objects.all()
    serializer_class = TimeOffTypeSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            # Everyone needs to be able to read the type list to fill
            # in a leave request; only HR manages the types themselves.
            return [permissions.IsAuthenticated()]
        return [IsHRManagerOrAbove()]


class AllocationViewSet(viewsets.ModelViewSet):
    queryset = Allocation.objects.all()
    serializer_class = AllocationSerializer
    permission_classes = [IsHRManagerOrAbove]


class TimeOffRequestViewSet(viewsets.ModelViewSet):
    queryset = TimeOffRequest.objects.all()
    serializer_class = TimeOffRequestSerializer

    def get_queryset(self):
        qs = TimeOffRequest.objects.all()
        profile = getattr(self.request.user, "profile", None)
        if profile and profile.role == UserProfile.ROLE_EMPLOYEE:
            # Employees only ever see (and can only act on) their own
            # requests - HR/Admin keep the full list.
            qs = qs.filter(employee=profile.employee)
        else:
            # A draft hasn't been filed yet - HR/Admin shouldn't see it
            # until the employee submits it.
            qs = qs.exclude(status=TimeOffRequest.STATUS_DRAFT)
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "submit", "cancel"):
            # Only employees file/edit/withdraw leave requests for themselves.
            return [permissions.IsAuthenticated(), IsEmployeeRole()]
        if self.action in ("approve", "refuse"):
            # Only HR Manager and above may decide on a request.
            return [permissions.IsAuthenticated(), IsHRManagerOrAbove()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        employee = getattr(profile, "employee", None)
        if employee is None:
            raise DRFValidationError("Your account is not linked to an employee record.")
        as_draft = bool(self.request.data.get("draft"))
        status = TimeOffRequest.STATUS_DRAFT if as_draft else TimeOffRequest.STATUS_SUBMITTED
        serializer.save(employee=employee, status=status)

    def perform_update(self, serializer):
        if serializer.instance.status not in (TimeOffRequest.STATUS_DRAFT, TimeOffRequest.STATUS_SUBMITTED):
            raise DRFValidationError("Only draft or submitted requests can be modified.")
        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        req = self.get_object()
        try:
            submit_request(req)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(TimeOffRequestSerializer(req).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        req = self.get_object()
        try:
            cancel_request(req)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(TimeOffRequestSerializer(req).data)

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