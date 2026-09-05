from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import Employee


class UserProfile(models.Model):
    """
    Extends Django's built-in User with a role and an optional link to
    a core.Employee record. We extend rather than replace auth.User
    since JWT auth (SimpleJWT) is already wired against it.
    """
    ROLE_EMPLOYEE = 0
    ROLE_HR_MANAGER = 1
    ROLE_HR_PAYROLL_USER = 2
    ROLE_HR_PAYROLL_MANAGER = 3
    ROLE_ADMIN = 4

    ROLE_CHOICES = [
        (ROLE_EMPLOYEE, "Employee"),
        (ROLE_HR_MANAGER, "HR Manager"),
        (ROLE_HR_PAYROLL_USER, "HR Payroll User"),
        (ROLE_HR_PAYROLL_MANAGER, "HR Payroll Manager"),
        (ROLE_ADMIN, "Admin"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.IntegerField(choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)

    employee = models.OneToOneField(
        Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name="user_profile"
    )

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)