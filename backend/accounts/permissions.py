from rest_framework.permissions import BasePermission
from .models import UserProfile


def _get_role(request):
    if not request.user.is_authenticated:
        return None
    profile = getattr(request.user, "profile", None)
    return profile.role if profile else None


class HasMinimumRole(BasePermission):
    minimum_role = UserProfile.ROLE_EMPLOYEE

    def has_permission(self, request, view):
        role = _get_role(request)
        return role is not None and role >= self.minimum_role


class IsHRManagerOrAbove(HasMinimumRole):
    minimum_role = UserProfile.ROLE_HR_MANAGER


class IsHRPayrollUserOrAbove(HasMinimumRole):
    minimum_role = UserProfile.ROLE_HR_PAYROLL_USER


class IsHRPayrollManagerOrAbove(HasMinimumRole):
    minimum_role = UserProfile.ROLE_HR_PAYROLL_MANAGER


class IsAdmin(HasMinimumRole):
    minimum_role = UserProfile.ROLE_ADMIN