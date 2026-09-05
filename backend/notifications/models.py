from django.conf import settings
from django.db import models


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    event_type = models.CharField(max_length=64, db_index=True)
    message = models.CharField(max_length=255)
    related_model = models.CharField(max_length=128, blank=True)
    related_record_id = models.CharField(max_length=64, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.event_type}] -> {self.recipient}: {self.message}"
