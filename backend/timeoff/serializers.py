from rest_framework import serializers
from .models import TimeOffType, Allocation, TimeOffRequest


class TimeOffTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeOffType
        fields = "__all__"


class AllocationSerializer(serializers.ModelSerializer):
    remaining_days = serializers.ReadOnlyField()

    class Meta:
        model = Allocation
        fields = ["id", "employee", "time_off_type", "allocated_days", "used_days",
                  "remaining_days", "valid_from", "valid_to", "status"]


class TimeOffRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeOffRequest
        fields = "__all__"
        read_only_fields = ["status", "allocation"]