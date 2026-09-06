from django.conf import settings
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


class IsEmployeeRole(BasePermission):
    """
    Exact-match, not a minimum-role check - time off requests are
    submitted by employees for themselves, not by their managers.
    """

    def has_permission(self, request, view):
        return _get_role(request) == UserProfile.ROLE_EMPLOYEE


class IsHRManagerOrAbove(HasMinimumRole):
    minimum_role = UserProfile.ROLE_HR_MANAGER


class IsHRPayrollUserOrAbove(HasMinimumRole):
    minimum_role = UserProfile.ROLE_HR_PAYROLL_USER


class IsHRPayrollManagerOrAbove(HasMinimumRole):
    minimum_role = UserProfile.ROLE_HR_PAYROLL_MANAGER


class IsAdmin(HasMinimumRole):
    minimum_role = UserProfile.ROLE_ADMIN


class HasScannerKey(BasePermission):
    """
    Lets the offline attendance scanner (a standalone script run on a
    kiosk PC, not a logged-in browser) call qr_scan without a user
    session - it authenticates with a shared device key instead, sent as
    X-Scanner-Key. The scanned QR token itself then identifies *which*
    employee the scan is for.
    """

    def has_permission(self, request, view):
        key = request.headers.get("X-Scanner-Key", "")
        return bool(settings.SCANNER_API_KEY) and key == settings.SCANNER_API_KEY