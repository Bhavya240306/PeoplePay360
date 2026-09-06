from rest_framework import serializers
from .models import TimeOffType, Allocation, TimeOffRequest


class TimeOffTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeOffType
        fields = "__all__"

    def validate(self, attrs):
        affects_payroll = attrs.get("affects_payroll", getattr(self.instance, "affects_payroll", False))
        default_allocated_days = attrs.get(
            "default_allocated_days", getattr(self.instance, "default_allocated_days", None)
        )
        if affects_payroll and default_allocated_days is not None:
            raise serializers.ValidationError(
                "Allocated days only apply to leave types that don't affect payroll."
            )
        return attrs


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
        # employee is never client-supplied - the view sets it to the
        # requesting user's own employee record on create. duration_days
        # is always derived from date_from/date_to, never typed in.
        read_only_fields = ["status", "allocation", "employee", "duration_days"]

    def validate(self, attrs):
        date_from = attrs.get("date_from") or getattr(self.instance, "date_from", None)
        date_to = attrs.get("date_to") or getattr(self.instance, "date_to", None)
        if date_from and date_to:
            if date_to < date_from:
                raise serializers.ValidationError("End date must be on or after the start date.")
            attrs["duration_days"] = (date_to - date_from).days + 1

            employee = self.instance.employee if self.instance is not None else None
            if employee is None:
                request = self.context.get("request")
                profile = getattr(request.user, "profile", None) if request else None
                employee = getattr(profile, "employee", None)

            if employee is not None:
                overlap_qs = TimeOffRequest.objects.filter(
                    employee=employee,
                    status__in=[
                        TimeOffRequest.STATUS_DRAFT,
                        TimeOffRequest.STATUS_SUBMITTED,
                        TimeOffRequest.STATUS_APPROVED,
                    ],
                    date_from__lte=date_to,
                    date_to__gte=date_from,
                )
                if self.instance is not None:
                    overlap_qs = overlap_qs.exclude(pk=self.instance.pk)
                if overlap_qs.exists():
                    raise serializers.ValidationError(
                        "You already have a leave request that overlaps these dates."
                    )
        return attrs