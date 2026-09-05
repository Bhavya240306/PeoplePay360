"""
Time Off business logic. The one rule that must never break: approving
a request that draws on an allocation has to decrement that
allocation's balance in the same transaction as the status change -
otherwise a race (two approvals landing at once) or a crash mid-way
could grant more leave than was ever allocated.
"""
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from approvals.services import start_approval, act_on_step, ApprovalError
from audit.services import log_change
from audit.models import AuditLog
from core.events import event_bus, EVENT_LEAVE_SUBMITTED, EVENT_LEAVE_APPROVED, EVENT_LEAVE_REFUSED

from .models import TimeOffRequest, Allocation

APPROVAL_PROCESS = "timeoff"


class TimeOffError(Exception):
    pass


def _find_allocation(employee, time_off_type, date_from):
    return (
        Allocation.objects.filter(
            employee=employee, time_off_type=time_off_type,
            period_start__lte=date_from, period_end__gte=date_from,
            status=Allocation.STATUS_APPROVED,
        )
        .order_by("-period_start")
        .first()
    )


@transaction.atomic
def submit_request(request_obj: TimeOffRequest, approver=None):
    """
    Validates balance (for allocation-requiring types), links the
    Allocation the eventual approval will draw from, starts the
    multi-level approval chain, and moves status to `submitted`.
    """
    if request_obj.time_off_type.requires_allocation:
        allocation = _find_allocation(request_obj.employee, request_obj.time_off_type, request_obj.date_from)
        if allocation is None:
            raise TimeOffError("No active allocation covers this period for this leave type.")
        if allocation.remaining_days < request_obj.duration_days:
            raise TimeOffError(
                f"Insufficient balance: {allocation.remaining_days} remaining, "
                f"{request_obj.duration_days} requested."
            )
        request_obj.allocation = allocation

    request_obj.status = TimeOffRequest.STATUS_SUBMITTED
    request_obj.save()

    start_approval(APPROVAL_PROCESS, request_obj)
    log_change(request_obj, request_obj.employee, AuditLog.ACTION_UPDATE, diff={"status": ["draft", "submitted"]})
    event_bus.fire(EVENT_LEAVE_SUBMITTED, instance=request_obj, approver=approver)
    return request_obj


@transaction.atomic
def approve_step(request_obj: TimeOffRequest, user):
    """
    One reviewer approving their step. If this was the last required
    step, atomically decrement the allocation and flip status to
    `approved`. Raises ApprovalError if the user's role level is too
    low for the current step (bubbled up from approvals.services).
    """
    result = act_on_step(APPROVAL_PROCESS, request_obj, user, approve=True)

    if result["fully_approved"]:
        if request_obj.allocation_id:
            # select_for_update locks the allocation row so two
            # simultaneous approvals can't both pass the balance check
            # and double-spend the same days.
            allocation = Allocation.objects.select_for_update().get(pk=request_obj.allocation_id)
            if allocation.remaining_days < request_obj.duration_days:
                raise TimeOffError("Allocation balance changed and is now insufficient.")
            allocation.used_days = allocation.used_days + Decimal(request_obj.duration_days)
            allocation.save(update_fields=["used_days"])

        request_obj.status = TimeOffRequest.STATUS_APPROVED
        request_obj.save(update_fields=["status"])
        log_change(request_obj, user, AuditLog.ACTION_APPROVE, diff={"status": ["submitted", "approved"]})
        event_bus.fire(EVENT_LEAVE_APPROVED, instance=request_obj, user=user)

    return request_obj


@transaction.atomic
def refuse_step(request_obj: TimeOffRequest, user, reason=""):
    act_on_step(APPROVAL_PROCESS, request_obj, user, approve=False, reason=reason)
    request_obj.status = TimeOffRequest.STATUS_REFUSED
    request_obj.save(update_fields=["status"])
    log_change(request_obj, user, AuditLog.ACTION_REJECT, diff={"status": ["submitted", "refused"]}, reason=reason)
    event_bus.fire(EVENT_LEAVE_REFUSED, instance=request_obj, user=user)
    return request_obj
