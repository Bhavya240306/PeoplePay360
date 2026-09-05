from rest_framework import serializers
from .models import Settlement


class SettlementSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)

    class Meta:
        model = Settlement
        fields = ["id", "employee", "employee_name", "termination_date", "status", "final_amount", "breakdown", "notes", "created_at"]
        read_only_fields = ["status", "final_amount", "breakdown", "created_at"]
