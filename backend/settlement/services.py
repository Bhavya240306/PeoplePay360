"""
Full & final settlement trigger. This app owns *when* settlement fires
(employee status change) and the record of it; the actual money math
is Person 2's payroll engine. The interface below is the contract to
agree with Person 2 early, per the hackathon note - it's deliberately
narrow (one function, plain-Python types in and out) so either side
can build against it without waiting on the other's models.

Expected interface from Person 2's payroll engine:

    def compute_final_settlement(employee, termination_date) -> dict:
        '''
        Returns e.g. {
            "final_amount": Decimal("48500.00"),
            "breakdown": {
                "prorated_salary": "42000.00",
                "leave_encashment": "6500.00",
                "deductions": "0.00",
            },
        }
        '''

Until that's wired in, PAYROLL_ENGINE is a stub that returns zeros so
the rest of this flow (audit, notification, status flip) is fully
testable in isolation.
"""
from django.db import transaction

from audit.services import log_change
from audit.models import AuditLog
from core.events import event_bus, EVENT_EMPLOYEE_OFFBOARDED

from .models import Settlement


def _stub_compute_final_settlement(employee, termination_date):
    return {"final_amount": 0, "breakdown": {"note": "payroll engine not yet connected"}}


# Swap this for Person 2's real function once the payroll engine exists,
# e.g.: from payroll.engine import compute_final_settlement as PAYROLL_ENGINE
PAYROLL_ENGINE = _stub_compute_final_settlement


@transaction.atomic
def trigger_settlement(employee, termination_date, triggered_by=None):
    settlement = Settlement.objects.create(employee=employee, termination_date=termination_date)

    result = PAYROLL_ENGINE(employee, termination_date)
    settlement.final_amount = result.get("final_amount")
    settlement.breakdown = result.get("breakdown", {})
    settlement.status = Settlement.STATUS_COMPUTED
    settlement.save()

    employee.is_active_employee = False
    employee.save(update_fields=["is_active_employee"])

    log_change(
        settlement, triggered_by, AuditLog.ACTION_CREATE,
        diff={"status": [None, "computed"], "final_amount": [None, str(settlement.final_amount)]},
    )
    event_bus.fire(EVENT_EMPLOYEE_OFFBOARDED, instance=settlement, user=triggered_by)
    return settlement
