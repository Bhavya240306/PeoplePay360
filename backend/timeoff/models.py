from django.db import models
from core.models import Employee


class TimeOffType(models.Model):
    """
    Defines how a leave type behaves. requires_allocation=False types
    (e.g. unpaid leave) skip the balance check entirely. affects_payroll
    marks types that should reduce salary — the field your payroll
    engine reads to compute unpaid-leave deductions.
    """
    name = models.CharField(max_length=64, unique=True)
    requires_allocation = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    affects_payroll = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Allocation(models.Model):
    """
    A balance grant — e.g. '20 days annual leave, valid Jan-Dec 2026'.
    remaining_days is always computed, never stored, so it can't drift
    out of sync with allocated/used.
    """
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_CHOICES = [(STATUS_PENDING, "Pending"), (STATUS_APPROVED, "Approved")]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="allocations")
    time_off_type = models.ForeignKey(TimeOffType, on_delete=models.PROTECT, related_name="allocations")

    allocated_days = models.DecimalField(max_digits=6, decimal_places=2)
    used_days = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    valid_from = models.DateField()
    valid_to = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_APPROVED)

    class Meta:
        ordering = ["-valid_from"]

    @property
    def remaining_days(self):
        return self.allocated_days - self.used_days

    def __str__(self):
        return f"{self.employee} / {self.time_off_type}: {self.remaining_days} left"


class TimeOffRequest(models.Model):
    """
    An actual leave request. Approve/refuse ONLY through
    services.approve_request() / refuse_request() — never by editing
    .status directly — so the allocation decrement stays atomic.
    """
    STATUS_DRAFT = "draft"
    STATUS_SUBMITTED = "submitted"
    STATUS_APPROVED = "approved"
    STATUS_REFUSED = "refused"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REFUSED, "Refused"),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="timeoff_requests")
    time_off_type = models.ForeignKey(TimeOffType, on_delete=models.PROTECT, related_name="requests")
    date_from = models.DateField()
    date_to = models.DateField()
    duration_days = models.DecimalField(max_digits=6, decimal_places=2)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    reason = models.CharField(max_length=255, blank=True)
    allocation = models.ForeignKey(
        Allocation, null=True, blank=True, on_delete=models.SET_NULL, related_name="requests"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee} / {self.time_off_type}: {self.date_from} - {self.date_to} ({self.status})"