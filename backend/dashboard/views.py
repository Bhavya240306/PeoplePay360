from decimal import Decimal
from django.db.models import Sum, Avg, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.permissions import IsHRPayrollUserOrAbove
from payroll.models import Payslip, PayslipLine, Payrun
from core.models import Employee, Contract, Attendance
from timeoff.models import TimeOffRequest


class DashboardView(APIView):
    """
    Read-only aggregation over existing tables — deliberately has no
    models of its own. Supports ?period_start=&period_end=&department=
    query params, matching the brief's Period/Department/Employee Type
    filter bar. Always queries live data, never a cached/duplicated copy.
    """
    permission_classes = [IsHRPayrollUserOrAbove]

    def get(self, request):
        period_start = request.query_params.get("period_start")
        period_end = request.query_params.get("period_end")
        department = request.query_params.get("department")

        payslips = Payslip.objects.filter(status="computed")
        payruns = Payrun.objects.all()

        if period_start:
            payruns = payruns.filter(period_start__gte=period_start)
            payslips = payslips.filter(payrun__period_start__gte=period_start)
        if period_end:
            payruns = payruns.filter(period_end__lte=period_end)
            payslips = payslips.filter(payrun__period_end__lte=period_end)
        if department:
            emp_ids = Employee.objects.filter(department=department).values_list("id", flat=True)
            payslips = payslips.filter(employee_id__in=emp_ids)

        # --- KPIs ---
        net_lines = PayslipLine.objects.filter(payslip__in=payslips, rule_code="NET")
        total_net_paid = net_lines.aggregate(total=Sum("amount"))["total"] or Decimal("0")
        avg_salary = net_lines.aggregate(avg=Avg("amount"))["avg"] or Decimal("0")
        payslips_generated = payslips.count()

        approved_timeoff = TimeOffRequest.objects.filter(status="approved").count()

        total_attendance = Attendance.objects.count()
        present_attendance = Attendance.objects.filter(status__in=["present", "late", "half_day"]).count()
        attendance_health = round((present_attendance / total_attendance) * 100, 1) if total_attendance else 0

        # --- Chart: salary cost by department ---
        cost_by_department = []
        departments = Employee.objects.values_list("department", flat=True).distinct()
        for dept in departments:
            if not dept:
                continue
            emp_ids = Employee.objects.filter(department=dept).values_list("id", flat=True)
            dept_total = net_lines.filter(payslip__employee_id__in=emp_ids).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0")
            cost_by_department.append({"department": dept, "total_net": dept_total})

        # --- Chart: monthly net salary trend ---
        monthly_trend = []
        for payrun in payruns.order_by("period_start"):
            month_total = net_lines.filter(payslip__payrun=payrun).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0")
            monthly_trend.append({
                "period": payrun.name or str(payrun.period_start),
                "total_net": month_total,
            })

        # --- Alerts: named, countable types, per the brief ---
        missing_bank_details = Payslip.objects.filter(
            warnings__contains=["Missing bank details"]
        ).count()
        payslips_pending = Payslip.objects.filter(status="draft").count()
        draft_payruns = Payrun.objects.filter(status="draft").count()

        contracts_expiring_soon = Contract.objects.filter(
            end_date__isnull=False,
        ).extra(
            where=["end_date <= (CURRENT_DATE + INTERVAL '30 days')", "end_date >= CURRENT_DATE"]
        ).count()

        return Response({
            "kpis": {
                "total_net_salary_paid": total_net_paid,
                "payslips_generated": payslips_generated,
                "average_salary": round(avg_salary, 2),
                "approved_timeoff": approved_timeoff,
                "attendance_health_percent": attendance_health,
            },
            "charts": {
                "salary_cost_by_department": cost_by_department,
                "monthly_net_salary_trend": monthly_trend,
            },
            "alerts": {
                "missing_bank_details": missing_bank_details,
                "payslips_pending": payslips_pending,
                "draft_payruns_unpaid": draft_payruns,
                "contracts_expiring_this_month": contracts_expiring_soon,
            },
        })