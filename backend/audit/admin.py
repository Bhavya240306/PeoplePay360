from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("model_name", "record_id", "user", "action", "timestamp")
    list_filter = ("model_name", "action")
    readonly_fields = [f.name for f in AuditLog._meta.fields]  # fully read-only in admin too