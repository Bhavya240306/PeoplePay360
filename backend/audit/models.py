from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Generic, model-agnostic audit trail. Any app can write to this
    without importing that app's models here — `model_name`/`record_id`
    is a soft reference (like a lightweight GenericForeignKey without
    the content-type machinery), which keeps this app dependency-free
    so it can be added first and everyone else hooks into it.
    """
    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_APPROVE = "approve"
    ACTION_REJECT = "reject"
    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
        (ACTION_APPROVE, "Approve"),
        (ACTION_REJECT, "Reject"),
    ]

    model = models.CharField(max_length=128, db_index=True, help_text="e.g. 'timeoff.TimeOffRequest'")
    record_id = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="audit_entries",
    )
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    diff = models.JSONField(
        default=dict, blank=True,
        help_text='e.g. {"status": ["submitted", "approved"], "notes": ["", "ok"]}',
    )
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [models.Index(fields=["model", "record_id"])]

    def __str__(self):
        return f"{self.action} on {self.model}#{self.record_id} by {self.user}"
