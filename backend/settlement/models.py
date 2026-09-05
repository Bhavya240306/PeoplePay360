from django.db import models
from core.models import Employee
from payroll.models import Payslip


class Settlement(models.Model):
    """
    One record per offboarded employee — a summary/audit trail of what
    was paid out on exit, separate from the regular monthly Payslip
    flow. Links to the actual final Payslip once computed.
    """
    STATUS_PENDING = "pending"
    STATUS_COMPUTED = "computed"
    STATUS_PAID = "paid"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPUTED, "Computed"),
        (STATUS_PAID, "Paid"),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="settlements")
    last_working_day = models.DateField()
    unpaid_leave_encashment_days = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    prorated_basic = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_payslip = models.OneToOneField(
        Payslip, null=True, blank=True, on_delete=models.SET_NULL, related_name="settlement"
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Settlement for {self.employee} ({self.status})"