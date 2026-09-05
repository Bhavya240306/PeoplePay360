from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("model", "record_id", "action", "user", "timestamp")
    list_filter = ("action", "model")
