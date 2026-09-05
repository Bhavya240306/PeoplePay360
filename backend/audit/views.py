from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AuditLog
from .serializers import AuditLogSerializer
from .services import history_for


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only: audit entries are never created/edited through the API,
    only by other apps calling `log_change()` internally.

    GET /api/audit/history/?model=timeoff.timeoffrequest&record_id=12
    powers the reusable "History" tab on any record's detail page.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"])
    def history(self, request):
        model = request.query_params.get("model")
        record_id = request.query_params.get("record_id")
        if not model or not record_id:
            return Response({"detail": "model and record_id are required"}, status=400)
        qs = history_for(model, record_id)
        return Response(AuditLogSerializer(qs, many=True).data)
