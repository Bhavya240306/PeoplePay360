from accounts.models import UserProfile
from .models import Notification


def notify_employee(employee, event_type, message):
    """
    Looks up the UserProfile linked to this Employee (if any) and
    creates a notification for that user. Silently does nothing if no
    login is linked yet — this is intentionally non-fatal, since not
    every Employee necessarily has a User account.
    """
    profile = UserProfile.objects.filter(employee=employee).first()
    if profile:
        Notification.objects.create(user=profile.user, event_type=event_type, message=message)


def notify_user(user, event_type, message):
    Notification.objects.create(user=user, event_type=event_type, message=message)