from rest_framework import viewsets, permissions
from .models import Settlement
from .serializers import SettlementSerializer


class SettlementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Settlement.objects.all()
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]