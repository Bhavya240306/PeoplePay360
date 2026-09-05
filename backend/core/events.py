"""
Lightweight in-process event bus.

Audit logging and Notifications are both "reactions to something that
happened" (a leave was approved, a payslip was generated, a contract is
expiring...). Rather than having every app call `AuditLog.objects.create()`
and `Notification.objects.create()` by hand at every call site, other apps
just fire a named event with a payload, and the audit/notifications apps
each register listeners for the events they care about.

Usage from anywhere in the codebase:

    from core.events import event_bus

    event_bus.fire(
        "leave.approved",
        instance=timeoff_request,
        user=request.user,
        diff={"status": ["submitted", "approved"]},
    )

Registering a listener (done once, in each app's apps.py `ready()`):

    from core.events import event_bus

    def _on_leave_approved(instance, user, diff=None, **kwargs):
        ...

    event_bus.subscribe("leave.approved", _on_leave_approved)
"""
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class EventBus:
    def __init__(self):
        self._listeners = defaultdict(list)

    def subscribe(self, event_name, handler):
        self._listeners[event_name].append(handler)

    def fire(self, event_name, **payload):
        """
        Call every handler registered for event_name. A handler raising
        should never break the caller's actual business transaction (e.g.
        a broken notification handler must not stop a leave request from
        being approved), so each handler is isolated in a try/except.
        """
        for handler in self._listeners.get(event_name, []):
            try:
                handler(event_name=event_name, **payload)
            except Exception:
                logger.exception(
                    "Event handler %s failed for event %s", handler, event_name
                )


# Singleton used across the whole project
event_bus = EventBus()

# Canonical event names, kept in one place so every app spells them the
# same way. Extend this list as new event-producing flows are added.
EVENT_LEAVE_SUBMITTED = "leave.submitted"
EVENT_LEAVE_APPROVED = "leave.approved"
EVENT_LEAVE_REFUSED = "leave.refused"
EVENT_PAYSLIP_GENERATED = "payslip.generated"
EVENT_CONTRACT_EXPIRING = "contract.expiring"
EVENT_EMPLOYEE_OFFBOARDED = "employee.offboarded"
EVENT_PAYRUN_VALIDATED = "payrun.validated"
