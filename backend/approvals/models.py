from django.db import models


class ApprovalPolicy(models.Model):
    """
    Configures how many approval levels a given process requires, and
    the minimum Role.level needed to grant each one. This is what makes
    multi-level approval "a thin state check reusing the role
    hierarchy" rather than its own permission system: it just compares
    a user's Role.level against a number stored here.

    Example rows:
      process="timeoff", required_levels=[2]         -> one approval, by
                                                          HR Manager or above
      process="timeoff_extended", required_levels=[1, 2] -> HR Payroll User then
                                                              HR Manager, for requests over N days
      process="payrun", required_levels=[2, 3]       -> HR Manager then HR Payroll Admin
    """
    process = models.CharField(max_length=64, unique=True)
    required_levels = models.JSONField(
        default=list, help_text="Ordered list of minimum Role.level per approval step."
    )

    def __str__(self):
        return f"{self.process}: {self.required_levels}"


class ApprovalStep(models.Model):
    """
    One step of an in-progress multi-level approval, generic across
    processes the same way AuditLog is generic across models.
    """
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    process = models.CharField(max_length=64)
    target_model = models.CharField(max_length=128)
    target_record_id = models.CharField(max_length=64)
    step_index = models.PositiveSmallIntegerField()
    required_level = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    acted_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="approval_steps"
    )
    acted_at = models.DateTimeField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["target_model", "target_record_id", "step_index"]
        unique_together = ("process", "target_model", "target_record_id", "step_index")

    def __str__(self):
        return f"{self.process} step {self.step_index} for {self.target_model}#{self.target_record_id}: {self.status}"
