"""
Event listeners: this is the notifications app's half of the shared
event-driven pattern it co-owns with the audit log. Each handler reacts
to one event fired elsewhere (timeoff, payroll, contracts) and decides
who to notify — the firing code doesn't need to know notifications
exist at all.
"""
from .services import notify


def on_leave_approved(instance, user=None, **kwargs):
    notify(
        recipient=instance.employee,
        event_type="leave.approved",
        message=f"Your time off request ({instance.date_from} to {instance.date_to}) was approved.",
        related_object=instance,
    )


def on_leave_refused(instance, user=None, **kwargs):
    notify(
        recipient=instance.employee,
        event_type="leave.refused",
        message=f"Your time off request ({instance.date_from} to {instance.date_to}) was refused.",
        related_object=instance,
    )


def on_leave_submitted(instance, approver=None, **kwargs):
    if approver:
        notify(
            recipient=approver,
            event_type="leave.submitted",
            message=f"{instance.employee} submitted a time off request awaiting your approval.",
            related_object=instance,
        )


def on_payslip_generated(instance, **kwargs):
    recipient = getattr(instance, "employee", None)
    if recipient:
        notify(
            recipient=recipient,
            event_type="payslip.generated",
            message="Your payslip is ready.",
            related_object=instance,
        )


def on_contract_expiring(instance, hr_user=None, **kwargs):
    recipient = hr_user or getattr(instance, "employee", None)
    if recipient:
        notify(
            recipient=recipient,
            event_type="contract.expiring",
            message="A contract is expiring soon.",
            related_object=instance,
        )


def register():
    from core.events import (
        event_bus,
        EVENT_LEAVE_APPROVED,
        EVENT_LEAVE_REFUSED,
        EVENT_LEAVE_SUBMITTED,
        EVENT_PAYSLIP_GENERATED,
        EVENT_CONTRACT_EXPIRING,
    )
    event_bus.subscribe(EVENT_LEAVE_APPROVED, on_leave_approved)
    event_bus.subscribe(EVENT_LEAVE_REFUSED, on_leave_refused)
    event_bus.subscribe(EVENT_LEAVE_SUBMITTED, on_leave_submitted)
    event_bus.subscribe(EVENT_PAYSLIP_GENERATED, on_payslip_generated)
    event_bus.subscribe(EVENT_CONTRACT_EXPIRING, on_contract_expiring)
