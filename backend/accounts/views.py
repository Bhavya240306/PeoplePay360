from rest_framework import viewsets, permissions

from audit.mixins import AuditLoggingSerializerMixin
from audit.services import log_change
from audit.models import AuditLog
from .models import User, Role, Department
from .serializers import UserSerializer, RoleSerializer, DepartmentSerializer


class IsAdminRole(permissions.BasePermission):
    """Only users with the Admin role can create/edit users or roles."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.has_role("Admin")


class AuditedUserSerializer(AuditLoggingSerializerMixin, UserSerializer):
    AUDITED_FIELDS = ["is_active", "is_active_employee", "department", "roles"]


class UserViewSet(viewsets.ModelViewSet):
    """Backs the Admin/User Management screen: create users, assign roles via checkboxes."""
    queryset = User.objects.select_related("department").prefetch_related("roles")
    serializer_class = AuditedUserSerializer
    permission_classes = [IsAdminRole]


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminRole]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminRole]
