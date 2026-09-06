import io
from datetime import datetime, timedelta

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsHRManagerOrAbove, HasScannerKey
from .models import Employee, Contract, Attendance, Schedule
from .serializers import EmployeeSerializer, ContractSerializer, AttendanceSerializer, ScheduleSerializer

WEEKDAY_NAMES = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]


def _own_employee(request):
    profile = getattr(request.user, "profile", None)
    return profile.employee if profile else None


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("-created_at")
    serializer_class = EmployeeSerializer
    permission_classes = [IsHRManagerOrAbove]


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all().order_by("-start_date")
    serializer_class = ContractSerializer
    permission_classes = [IsHRManagerOrAbove]

    def get_permissions(self):
        if self.action == "mine":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

    @action(detail=False, methods=["get"])
    def mine(self, request):
        employee = _own_employee(request)
        if employee is None:
            return Response({"detail": "Your account is not linked to an employee record."}, status=400)
        contracts = Contract.objects.filter(employee=employee).order_by("-start_date")
        return Response(ContractSerializer(contracts, many=True).data)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by("-date")
    serializer_class = AttendanceSerializer
    permission_classes = [IsHRManagerOrAbove]

    def get_permissions(self):
        if self.action in ("mine", "summary", "my_qr_code"):
            return [permissions.IsAuthenticated()]
        if self.action == "qr_scan":
            # Called by the offline scanner script, not a logged-in
            # browser - authenticated via a shared device key instead.
            return [HasScannerKey()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

    @action(detail=False, methods=["get"])
    def mine(self, request):
        employee = _own_employee(request)
        if employee is None:
            return Response({"detail": "Your account is not linked to an employee record."}, status=400)
        records = Attendance.objects.filter(employee=employee).order_by("-date")
        return Response(AttendanceSerializer(records, many=True).data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """
        Self-service attendance stats for the pie chart + weekly hours panel:
        present/absent days out of this month's working days, plus hours
        worked in the current Mon-Sun week.
        """
        employee = _own_employee(request)
        if employee is None:
            return Response({"detail": "Your account is not linked to an employee record."}, status=400)

        today = timezone.localdate()
        month_param = request.query_params.get("month")
        if month_param:
            year, month = (int(p) for p in month_param.split("-"))
        else:
            year, month = today.year, today.month

        first_day = today.replace(year=year, month=month, day=1)
        if month == 12:
            next_month = first_day.replace(year=year + 1, month=1)
        else:
            next_month = first_day.replace(month=month + 1)
        last_day = next_month - timedelta(days=1)
        period_end = min(last_day, today) if (year, month) == (today.year, today.month) else last_day

        schedules = {s.day_of_week: s for s in Schedule.objects.filter(employee=employee)}

        total_working_days = 0
        cursor = first_day
        while cursor <= period_end:
            weekday_name = WEEKDAY_NAMES[cursor.weekday()]
            schedule = schedules.get(weekday_name)
            is_working_day = schedule.is_working_day if schedule else cursor.weekday() < 5
            if is_working_day:
                total_working_days += 1
            cursor += timedelta(days=1)

        present_days = Attendance.objects.filter(
            employee=employee, date__gte=first_day, date__lte=period_end,
            status__in=["present", "late", "half_day"],
        ).count()

        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        weekly_hours = sum(
            a.worked_hours for a in Attendance.objects.filter(
                employee=employee, date__gte=week_start, date__lte=week_end,
            )
        )

        return Response({
            "period_start": first_day,
            "period_end": period_end,
            "present_days": present_days,
            "total_working_days": total_working_days,
            "absent_days": max(total_working_days - present_days, 0),
            "week_start": week_start,
            "week_end": week_end,
            "weekly_hours": float(weekly_hours),
        })

    @action(detail=False, methods=["post"], url_path="qr-scan")
    def qr_scan(self, request):
        """
        POST {"token": "..."} — called by the offline scanner (see
        scanner/offline_scanner.py), not a logged-in browser. `token` is
        the value decoded from the employee's own personal QR code
        (Employee.qr_token); it identifies who scanned. First scan of the
        day checks in, the next scan checks out. Relies on Attendance's
        (employee, date) uniqueness so there's always at most one row per
        employee per day to toggle.
        """
        token = request.data.get("token")
        employee = Employee.objects.filter(qr_token=token).first() if token else None
        if employee is None:
            return Response({"detail": "Invalid QR code."}, status=400)
        if not employee.is_active:
            return Response({"detail": "This employee is not active."}, status=400)

        now_dt = timezone.localtime()
        today = now_dt.date()
        now_time = now_dt.time()

        attendance, created = Attendance.objects.get_or_create(
            employee=employee, date=today, defaults={"check_in": now_time},
        )

        if created:
            schedule = Schedule.objects.filter(employee=employee, day_of_week=WEEKDAY_NAMES[today.weekday()]).first()
            if schedule and schedule.is_working_day and now_time > schedule.start_time:
                attendance.status = "late"
            else:
                attendance.status = "present"
            attendance.save()
            return Response({
                "employee": str(employee), "action": "check-in",
                "time": now_time, "status": attendance.status,
            })

        if attendance.check_out is None:
            attendance.check_out = now_time
            worked_seconds = (
                datetime.combine(today, attendance.check_out) - datetime.combine(today, attendance.check_in)
            ).total_seconds()
            attendance.worked_hours = round(max(worked_seconds, 0) / 3600, 2)
            attendance.save()
            return Response({
                "employee": str(employee), "action": "check-out",
                "time": now_time, "worked_hours": float(attendance.worked_hours),
            })

        return Response({"detail": f"{employee} has already checked out for today."}, status=400)

    @action(detail=False, methods=["get"], url_path="my-qr-code")
    def my_qr_code(self, request):
        """
        GET /api/attendance/my-qr-code/ — a PNG of the caller's own
        personal attendance QR code, to show the offline scanner. The
        raw token is never returned as JSON, only baked into the image.
        """
        import qrcode

        employee = _own_employee(request)
        if employee is None:
            return Response({"detail": "Your account is not linked to an employee record."}, status=400)

        img = qrcode.make(employee.qr_token)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return HttpResponse(buffer.getvalue(), content_type="image/png")


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsHRManagerOrAbove]

    def get_permissions(self):
        if self.action == "mine":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

    @action(detail=False, methods=["get"])
    def mine(self, request):
        employee = _own_employee(request)
        if employee is None:
            return Response({"detail": "Your account is not linked to an employee record."}, status=400)
        schedules = Schedule.objects.filter(employee=employee)
        order = {name: i for i, name in enumerate(WEEKDAY_NAMES)}
        schedules = sorted(schedules, key=lambda s: order.get(s.day_of_week, 99))
        return Response(ScheduleSerializer(schedules, many=True).data)
