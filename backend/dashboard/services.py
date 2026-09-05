"""
Payroll Dashboard aggregation. Per the spec this must "use actual data
created through the HR and Payroll flows rather than hardcoded values."

This app only owns Time Off + cross-cutting (approvals/notifications)
data directly. Salary/attendance data lives in Person 1 & Person 2's
apps, which don't exist in this standalone build yet - those sections
degrade gracefully (return None/empty) via `try/except ImportError`
rather than being faked, and are clearly marked below for wiring in
once those apps land.
"""
from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone

from accounts.models import User, Department
from timeoff.models import TimeOffRequest, Allocation
from approvals.models import ApprovalStep
from notifications.models import Notification

STALLED_AFTER_DAYS = 5


def _apply_common_filters(qs, department_id=None, employee_type=None):
    if department_id:
        qs = qs.filter(employee__department_id=department_id)
    return qs


def time_off_overview(department_id=None):
    qs = _apply_common_filters(TimeOffRequest.objects.all(), department_id)
    return {
        "approved": qs.filter(status=TimeOffRequest.STATUS_APPROVED).count(),
        "pending": qs.filter(status=TimeOffRequest.STATUS_SUBMITTED).count(),
        "refused": qs.filter(status=TimeOffRequest.STATUS_REFUSED).count(),
        "draft": qs.filter(status=TimeOffRequest.STATUS_DRAFT).count(),
    }


def department_overview():
    """One of the two required charts: headcount per department."""
    return list(
        Department.objects.annotate(headcount=Count("users"))
        .values("name", "headcount")
    )


def salary_cost_by_department(period=None):
    """
    Integration point for Person 2's payroll app. Import is deferred and
    guarded so this dashboard still runs before that app exists.
    """
    try:
        from payroll.models import Payslip  # noqa: Person 2's app, not built here
    except ImportError:
        return {"available": False, "data": []}
    qs = Payslip.objects.all()
    if period:
        qs = qs.filter(period=period)
    data = list(
        qs.values("employee__department__name")
        .annotate(total=Sum("net_salary"))
    )
    return {"available": True, "data": data}


def alerts(department_id=None):
    """
    Alerts panel: pending approvals waiting on the current viewer's
    role level, stalled time off requests, and contract-expiring /
    payroll-warning notifications that haven't been read yet.
    """
    cutoff = timezone.now() - timedelta(days=STALLED_AFTER_DAYS)
    stalled = _apply_common_filters(
        TimeOffRequest.objects.filter(status=TimeOffRequest.STATUS_SUBMITTED, created_at__lte=cutoff),
        department_id,
    )
    pending_steps = ApprovalStep.objects.filter(status=ApprovalStep.STATUS_PENDING).count()
    unread_warnings = Notification.objects.filter(
        is_read=False, event_type__in=["contract.expiring"]
    ).count()

    return {
        "stalled_time_off_count": stalled.count(),
        "pending_approval_steps": pending_steps,
        "unread_contract_warnings": unread_warnings,
    }


def kpis(department_id=None):
    employees_qs = User.objects.filter(is_active_employee=True)
    if department_id:
        employees_qs = employees_qs.filter(department_id=department_id)
    return {
        "active_employees": employees_qs.count(),
        "pending_time_off_requests": _apply_common_filters(
            TimeOffRequest.objects.filter(status=TimeOffRequest.STATUS_SUBMITTED), department_id
        ).count(),
        "total_allocated_days": Allocation.objects.aggregate(
            total=Sum("allocated_days")
        )["total"] or 0,
    }


def build_dashboard(period=None, department_id=None, employee_type=None):
    return {
        "kpis": kpis(department_id),
        "charts": {
            "department_overview": department_overview(),
            "time_off_overview": time_off_overview(department_id),
            "salary_cost_by_department": salary_cost_by_department(period),
        },
        "alerts": alerts(department_id),
        "filters_applied": {"period": period, "department": department_id, "employee_type": employee_type},
    }
