from rest_framework import serializers
from .models import TimeOffType, Allocation, TimeOffRequest


class TimeOffTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeOffType
        fields = ["id", "name", "requires_allocation", "color", "is_active"]


class AllocationSerializer(serializers.ModelSerializer):
    remaining_days = serializers.ReadOnlyField()
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)
    time_off_type_name = serializers.CharField(source="time_off_type.name", read_only=True)

    class Meta:
        model = Allocation
        fields = [
            "id", "employee", "employee_name", "time_off_type", "time_off_type_name",
            "allocated_days", "used_days", "remaining_days", "period_start", "period_end", "status",
        ]
        read_only_fields = ["used_days"]


class TimeOffRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.__str__", read_only=True)
    time_off_type_name = serializers.CharField(source="time_off_type.name", read_only=True)

    class Meta:
        model = TimeOffRequest
        fields = [
            "id", "employee", "employee_name", "time_off_type", "time_off_type_name",
            "date_from", "date_to", "duration_days", "status", "reason", "allocation", "created_at",
        ]
        read_only_fields = ["status", "allocation", "created_at"]

    def validate(self, data):
        date_from = data.get("date_from", getattr(self.instance, "date_from", None))
        date_to = data.get("date_to", getattr(self.instance, "date_to", None))
        duration_days = data.get("duration_days", getattr(self.instance, "duration_days", None))

        if date_from and date_to:
            if date_to < date_from:
                raise serializers.ValidationError({"date_to": "date_to cannot be before date_from."})
            span_days = (date_to - date_from).days + 1
            if duration_days is not None and duration_days > span_days:
                raise serializers.ValidationError(
                    {"duration_days": f"duration_days ({duration_days}) cannot exceed the {span_days}-day span between date_from and date_to."}
                )
        return data
