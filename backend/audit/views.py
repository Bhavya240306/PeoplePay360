from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only — nobody should be able to edit or delete audit entries
    through the API, only view them. Supports ?model_name=Contract&
    record_id=3 to power a "History" tab on any specific record.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AuditLog.objects.all()
        model_name = self.request.query_params.get("model_name")
        record_id = self.request.query_params.get("record_id")
        if model_name:
            qs = qs.filter(model_name=model_name)
        if record_id:
            qs = qs.filter(record_id=record_id)
        return qs