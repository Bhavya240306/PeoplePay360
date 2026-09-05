from django.db import transaction
from payroll.models import Payrun, Payslip, PayslipLine, SalaryStructure
from payroll.services import get_applicable_contract, evaluate_rule
from timeoff.models import Allocation
from .models import Settlement
from calendar import monthrange

@transaction.atomic
def process_settlement(employee, last_working_day, salary_structure=None):
    """
    Creates a one-off final Payrun + Payslip covering the employee's
    last partial month, proration, and unused-leave encashment.
    Reuses the existing payroll engine rather than duplicating logic —
    this is deliberately NOT a separate calculation path.
    """
    contract = get_applicable_contract(employee, last_working_day, last_working_day)
    if contract is None:
        raise ValueError("No applicable contract found for settlement period.")

    structure = salary_structure or contract.salary_structure if hasattr(contract, "salary_structure") else None
    if structure is None:
        structure = SalaryStructure.objects.filter(active=True).first()
    if structure is None:
        raise ValueError("No active Salary Structure available for settlement.")

    period_start = last_working_day.replace(day=1)

    # Create a one-off Payrun specifically for this settlement.
    payrun = Payrun.objects.create(
        name=f"Settlement - {employee} - {last_working_day}",
        salary_structure=structure,
        period_start=period_start,
        period_end=last_working_day,
        status="draft",
        employee_ids=[employee.pk],
    )

    # Proration: basic wage scaled to only the days actually worked
    # this month, per the brief's explicit "Proration for partial periods" ask.
    total_days_in_month = monthrange(last_working_day.year, last_working_day.month)[1]
    worked_days = (last_working_day - period_start).days + 1
    prorated_basic = (contract.basic_salary / total_days_in_month) * worked_days

    # Unused leave encashment: sum of remaining_days across all this
    # employee's approved allocations.
    remaining_leave = sum(
        a.remaining_days for a in Allocation.objects.filter(employee=employee, status="approved")
    )
    leave_encashment_amount = (contract.basic_salary / 30) * remaining_leave

    context = {
        "BASIC": float(prorated_basic),
        "WORKED_DAYS": worked_days,
        "LEAVE_ENCASHMENT": float(leave_encashment_amount),
    }

    payslip = Payslip.objects.create(
        payrun=payrun, employee_id=employee.pk, contract_id=contract.pk,
        worked_days=worked_days, status="draft",
    )

    from payroll.services import compute_structure
    line_items = compute_structure(structure, base_context=context)
    for item in line_items:
        PayslipLine.objects.create(payslip=payslip, **item)

    # Add the encashment as its own explicit line item, since it's not
    # part of the regular recurring SalaryStructure.
    PayslipLine.objects.create(
        payslip=payslip, rule_code="LEAVE_ENCASHMENT", rule_name="Unused Leave Encashment",
        category="allowance", sequence=999, amount=round(leave_encashment_amount, 2),
    )

    payslip.status = "computed"
    payslip.save()
    payrun.status = "computed"
    payrun.save()

    settlement = Settlement.objects.create(
        employee=employee,
        last_working_day=last_working_day,
        unpaid_leave_encashment_days=remaining_leave,
        prorated_basic=round(prorated_basic, 2),
        final_payslip=payslip,
        status=Settlement.STATUS_COMPUTED,
    )
    return settlement