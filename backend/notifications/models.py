from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    A simple in-app notification bell entry. event_type is a plain
    string rather than a choices-restricted field, so new event types
    can be added later without a migration.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    event_type = models.CharField(max_length=50)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user}: {self.message}"