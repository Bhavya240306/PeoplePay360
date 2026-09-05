from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "model", "record_id", "user", "user_display", "action", "timestamp", "diff", "reason"]

    def get_user_display(self, obj):
        return str(obj.user) if obj.user else "System"
