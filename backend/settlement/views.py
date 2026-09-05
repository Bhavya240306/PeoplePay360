from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import User
from .models import Settlement
from .serializers import SettlementSerializer
from .services import trigger_settlement


class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.select_related("employee")
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head"]  # created only via trigger, not raw POST create

    def create(self, request, *args, **kwargs):
        employee = User.objects.filter(pk=request.data.get("employee")).first()
        termination_date = request.data.get("termination_date")
        if not employee or not termination_date:
            return Response({"detail": "employee and termination_date are required"}, status=400)
        settlement = trigger_settlement(employee, termination_date, triggered_by=request.user)
        return Response(SettlementSerializer(settlement).data, status=201)
