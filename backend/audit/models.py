from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Generic activity trail. One row per create/update/delete on any
    tracked model. Uses plain strings (model_name, record_id) instead
    of a real ForeignKey/GenericForeignKey so this app never needs to
    import or depend on payroll/core/timeoff models directly — it just
    watches for signals from whichever models get registered.
    """
    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
    ]

    model_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=50)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    diff = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.model_name} #{self.record_id} {self.action} @ {self.timestamp}"