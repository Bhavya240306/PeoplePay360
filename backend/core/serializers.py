from rest_framework import serializers
from .models import Employee, Contract, Attendance, Schedule


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        # qr_token is a private "badge" secret - deliberately excluded from
        # every response. It's only ever used server-side (qr_scan) or
        # rendered into a QR image (my_qr_code), never serialized as JSON.
        fields = [
            "id", "employee_id", "first_name", "last_name", "email", "phone",
            "department", "job_title", "date_of_joining", "bank_account",
            "is_active", "created_at", "updated_at",
        ]


class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = "__all__"

    def validate(self, data):
        """
        Enforces the brief's core rule: no two active contracts for the
        same employee may overlap in time.

        Two date ranges [A_start, A_end] and [B_start, B_end] overlap if:
            A_start <= B_end (or B is ongoing) AND B_start <= A_end (or A is ongoing)
        """
        employee = data.get("employee") or getattr(self.instance, "employee", None)
        start_date = data.get("start_date") or getattr(self.instance, "start_date", None)
        end_date = data.get("end_date", getattr(self.instance, "end_date", None))
        is_active = data.get("is_active", getattr(self.instance, "is_active", True))

        if is_active and employee and start_date:
            overlapping = Contract.objects.filter(employee=employee, is_active=True)
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)

            for other in overlapping:
                # This contract starts before the other one ends (or the other is ongoing)
                starts_before_other_ends = other.end_date is None or start_date <= other.end_date
                # The other contract starts before this one ends (or this one is ongoing)
                other_starts_before_this_ends = end_date is None or other.start_date <= end_date

                if starts_before_other_ends and other_starts_before_this_ends:
                    raise serializers.ValidationError(
                        f"This employee already has an active contract overlapping this period "
                        f"({other.start_date} to {other.end_date or 'ongoing'})."
                    )
        return data


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"