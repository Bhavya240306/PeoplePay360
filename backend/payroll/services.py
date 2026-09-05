from simpleeval import simple_eval
from django.db.models import Q
from core.models import Contract, Attendance, Employee
from .models import Payslip, PayslipLine

def evaluate_rule(rule, context):
    """
    Resolves a single SalaryRule's value given the current context
    (a dict of already-computed rule codes -> values, e.g. {"BASIC": 30000}).
    Returns a float.
    """
    if rule.computation_type == "fixed":
        return float(rule.amount)

    elif rule.computation_type == "percentage":
        base_value = context.get(rule.percentage_of_code)
        if base_value is None:
            raise ValueError(f"'{rule.percentage_of_code}' not found in context for rule '{rule.code}'")
        return float(base_value) * float(rule.percentage) / 100

    elif rule.computation_type == "formula":
        # simple_eval is a SANDBOXED evaluator — it can only do basic
        # math using the variables we hand it via `names`. It cannot
        # import modules, call functions, or access the filesystem —
        # unlike raw eval(), which we NEVER use here.
        return simple_eval(rule.formula, names=context)

    raise ValueError(f"Unknown computation_type '{rule.computation_type}' on rule '{rule.code}'")


def compute_structure(structure, base_context):
    """
    Runs every rule in a SalaryStructure, in sequence order, building up
    context as it goes. Returns a list of line items, each with the
    resolved value, ready to become PayslipLine rows later in Phase D.
    """
    context = dict(base_context)  # don't mutate the caller's dict
    line_items = []

    for rule in structure.ordered_rules():
        value = evaluate_rule(rule, context)
        context[rule.code] = value  # make this rule's result available to later rules
        line_items.append({
            "rule_code": rule.code,
            "rule_name": rule.name,
            "category": rule.category,
            "sequence": rule.sequence,
            "amount": round(value, 2),
        })

    return line_items

def get_applicable_contract(employee, period_start, period_end):
    """
    Finds the one Contract that applies to this employee for the given
    payroll period — the core business rule from the brief: payroll must
    use the contract whose date range overlaps the period.
    """
    return (
        Contract.objects.filter(
            employee=employee,
            is_active=True,
            start_date__lte=period_end,
        )
        .filter(Q(end_date__isnull=True) | Q(end_date__gte=period_start))
        .order_by("-start_date")
        .first()
    )


def get_worked_days(employee, period_start, period_end):
    """
    Counts attendance days in the period that count as worked.
    Absent days are excluded; present/late/half_day all count.
    """
    return Attendance.objects.filter(
        employee=employee,
        date__gte=period_start,
        date__lte=period_end,
        status__in=["present", "late", "half_day"],
    ).count()


def build_payroll_context(employee, period_start, period_end):
    """
    Builds the base context dict fed into compute_structure().
    Raises ValueError if no applicable contract exists, so the caller
    can turn that into a Payslip warning instead of crashing the batch.
    """
    contract = get_applicable_contract(employee, period_start, period_end)
    if contract is None:
        raise ValueError(f"No applicable contract found for {employee}.")

    worked_days = get_worked_days(employee, period_start, period_end)

    return {
        "BASIC": float(contract.basic_salary),
        "WORKED_DAYS": worked_days,
    }, contract


def compute_payslip(employee, payrun):
    payslip, _ = Payslip.objects.get_or_create(payrun=payrun, employee_id=employee.pk)

    try:
        context, contract = build_payroll_context(employee, payrun.period_start, payrun.period_end)
    except ValueError as e:
        payslip.status = "draft"
        payslip.warnings = [str(e)]
        payslip.save()
        return payslip

    line_items = compute_structure(payrun.salary_structure, base_context=context)

    payslip.lines.all().delete()
    for item in line_items:
        PayslipLine.objects.create(payslip=payslip, **item)

    payslip.contract_id = contract.pk
    payslip.worked_days = context["WORKED_DAYS"]
    payslip.status = "computed"
    payslip.warnings = detect_warnings(employee, contract, context)   
    payslip.save()

    return payslip

def compute_payrun(payrun):
    """Runs compute_payslip for every employee selected in the Payrun."""
    results = []
    for emp_pk in payrun.employee_ids:
        try:
            employee = Employee.objects.get(pk=emp_pk)
        except Employee.DoesNotExist:
            continue
        results.append(compute_payslip(employee, payrun))

    payrun.status = "computed"
    payrun.save()
    return results

def detect_warnings(employee, contract, context):
    """
    Checks for known payroll issues on this employee's payslip.
    Returns a list of human-readable warning strings — empty list
    means no issues found. Called from compute_payslip() below.
    """
    warnings = []

    # Missing bank details — field name assumed as 'bank_account';
    # update this if Person 1 names it differently.
    bank_account = getattr(employee, "bank_account", None)
    if not bank_account:
        warnings.append("Missing bank details")

    if context.get("WORKED_DAYS", 0) == 0:
        warnings.append("Zero worked days recorded for this period")

    return warnings