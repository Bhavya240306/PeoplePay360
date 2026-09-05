from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """
    A role carries a `level` used as the hierarchy Person 1's access
    control and Person 3's multi-level approval both key off of.
    Higher level = more authority. Kept as plain integers (not an enum)
    so new roles/levels can be configured without a migration.
    """
    name = models.CharField(max_length=64, unique=True)
    level = models.PositiveSmallIntegerField(
        help_text="Higher = more approval authority. e.g. Employee=0, "
                   "HR Payroll User=1, HR Manager=2, HR Payroll Admin=3, Admin=4."
    )

    class Meta:
        ordering = ["level"]

    def __str__(self):
        return f"{self.name} (level {self.level})"


class Department(models.Model):
    name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Extends Django's built-in user. Roles are many-to-many because the
    Admin/User Management screen assigns roles via checkboxes (a user
    can be e.g. both "Manager" and "Finance").
    """
    employee_id = models.CharField(max_length=32, blank=True, unique=True, null=True)
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL, related_name="users"
    )
    roles = models.ManyToManyField(Role, blank=True, related_name="users")
    is_active_employee = models.BooleanField(
        default=True,
        help_text="Flips to False on offboarding/settlement completion.",
    )

    def highest_role_level(self):
        agg = self.roles.aggregate(models.Max("level"))
        return agg["level__max"] or 0

    def has_role(self, role_name):
        return self.roles.filter(name=role_name).exists()

    def __str__(self):
        return self.get_full_name() or self.username
