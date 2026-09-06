import calendar

from simpleeval import simple_eval
from django.db.models import Q
from django.utils import timezone
from core.models import Contract, Attendance, Employee
from .models import Payslip, PayslipLine, Payrun, SalaryStructure
from django.template.loader import render_to_string

from django.core.mail import EmailMessage
from core.models import Employee

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
        if rule.code in base_context:
            # A value seeded from outside (e.g. BASIC from the employee's
            # contract) is authoritative — don't let the rule's own static
            # definition (e.g. a "fixed" amount) silently overwrite it.
            value = base_context[rule.code]
        else:
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

def render_payslip_pdf(payslip):
    from xhtml2pdf import pisa
    from io import BytesIO

    employee = Employee.objects.filter(pk=payslip.employee_id).first()

    html_string = render_to_string("payroll/payslip.html", {
        "payslip": payslip,
        "payrun": payslip.payrun,
        "employee": employee,
        "lines": payslip.lines.all(),
    })

    buffer = BytesIO()
    pisa.CreatePDF(html_string, dest=buffer)
    return buffer.getvalue()


def send_payslip_email(payslip):
    """
    Emails a single computed Payslip as a PDF attachment, and stamps
    sent_at so the UI (and the employee's own payslip list) can show it
    was delivered. Returns True if an email was sent.
    """
    if payslip.status != "computed":
        return False

    pdf_bytes = render_payslip_pdf(payslip)

    employee = Employee.objects.filter(pk=payslip.employee_id).first()
    recipient = employee.email if employee else f"employee{payslip.employee_id}@example.com"

    email = EmailMessage(
        subject=f"Payslip — {payslip.payrun.name}",
        body="Please find your payslip attached.",
        to=[recipient],
    )
    email.attach(f"payslip_{payslip.id}.pdf", pdf_bytes, "application/pdf")
    email.send()

    payslip.sent_at = timezone.now()
    payslip.save(update_fields=["sent_at"])
    return True


def send_payrun_payslips(payrun):
    """
    Emails every computed Payslip in this Payrun as a PDF attachment.
    Returns the count of emails sent.
    """
    sent_count = 0
    for payslip in payrun.payslips.filter(status="computed"):
        if send_payslip_email(payslip):
            sent_count += 1
    return sent_count


def _month_bounds(reference_date=None):
    ref = reference_date or timezone.localdate()
    start = ref.replace(day=1)
    last_day = calendar.monthrange(ref.year, ref.month)[1]
    end = ref.replace(day=last_day)
    return start, end


def generate_monthly_payruns(reference_date=None):
    """
    Idempotently ensures every active employee with an applicable contract
    has a computed payslip for the current calendar month. Employees whose
    contract ends mid-month get their own payrun capped at the contract's
    end_date (so worked-days/proration stays correct), instead of being
    lumped into the shared full-month payrun.
    """
    structure = SalaryStructure.objects.filter(active=True).first()
    if structure is None:
        return []

    period_start, period_end = _month_bounds(reference_date)
    payruns = []
    regular_employee_ids = []

    for employee in Employee.objects.filter(is_active=True):
        contract = get_applicable_contract(employee, period_start, period_end)
        if contract is None:
            continue

        if contract.end_date and period_start <= contract.end_date < period_end:
            payrun, _ = Payrun.objects.get_or_create(
                name=f"{employee} — Final ({contract.end_date})",
                period_start=period_start,
                period_end=contract.end_date,
                defaults={"salary_structure": structure, "employee_ids": [employee.pk]},
            )
            if employee.pk not in payrun.employee_ids:
                payrun.employee_ids = list(set(payrun.employee_ids) | {employee.pk})
                payrun.save()
            compute_payrun(payrun)
            payruns.append(payrun)
        else:
            regular_employee_ids.append(employee.pk)

    if regular_employee_ids:
        payrun, _ = Payrun.objects.get_or_create(
            name=period_start.strftime("%B %Y"),
            period_start=period_start,
            period_end=period_end,
            defaults={"salary_structure": structure, "employee_ids": regular_employee_ids},
        )
        merged = set(payrun.employee_ids) | set(regular_employee_ids)
        if merged != set(payrun.employee_ids):
            payrun.employee_ids = list(merged)
            payrun.save()
        compute_payrun(payrun)
        payruns.append(payrun)

    return payruns

