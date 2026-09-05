from django.conf import settings
from django.db import models


class Settlement(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPUTED = "computed"
    STATUS_PAID = "paid"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPUTED, "Computed"),
        (STATUS_PAID, "Paid"),
    ]

    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="settlements")
    termination_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    final_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    breakdown = models.JSONField(
        default=dict, blank=True,
        help_text="Whatever Person 2's payroll engine returns: pro-rated pay, "
                   "leave encashment, deductions, etc.",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Settlement for {self.employee} ({self.status})"
