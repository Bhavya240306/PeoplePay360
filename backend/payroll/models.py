from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator
from django.db.models import Max

code_validator = RegexValidator(r"^[A-Z0-9_]{2,30}$", "2–30 uppercase letters, numbers, or underscores.")


class SalaryRule(models.Model):
    CATEGORY_CHOICES = [
        ("basic", "Basic"),
        ("allowance", "Allowance"),
        ("gross", "Gross"),
        ("deduction", "Deduction"),
        ("net", "Net"),
    ]
    COMPUTATION_CHOICES = [
        ("fixed", "Fixed"),
        ("percentage", "Percentage"),
        ("formula", "Formula"),
    ]

    # Each category owns a fixed 100-wide band of sequence numbers, in
    # payroll computation order (basic -> allowances -> gross -> deductions
    # -> net). New rules are auto-appended within their category's band
    # (see next_sequence_for_category) so cross-category ordering is
    # always correct without the user ever entering a sequence by hand.
    CATEGORY_BANDS = {
        "basic": 10,
        "allowance": 100,
        "gross": 200,
        "deduction": 300,
        "net": 400,
    }
    BAND_WIDTH = 100
    SEQUENCE_STEP = 10

    code = models.CharField(max_length=30, unique=True, validators=[code_validator])
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    sequence = models.PositiveIntegerField(default=10)
    computation_type = models.CharField(max_length=20, choices=COMPUTATION_CHOICES)

    amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    percentage = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    percentage_of_code = models.CharField(max_length=30, null=True, blank=True)
    formula = models.CharField(max_length=255, null=True, blank=True)

    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sequence"]

    @classmethod
    def next_sequence_for_category(cls, category, exclude_pk=None):
        band_start = cls.CATEGORY_BANDS[category]
        qs = cls.objects.filter(sequence__gte=band_start, sequence__lt=band_start + cls.BAND_WIDTH)
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        current_max = qs.aggregate(m=Max("sequence"))["m"]
        return current_max + cls.SEQUENCE_STEP if current_max is not None else band_start

    def clean(self):
        if self.computation_type == "fixed" and self.amount is None:
            raise ValidationError("Fixed rules require an amount.")
        if self.computation_type == "percentage" and (
            self.percentage is None or not self.percentage_of_code
        ):
            raise ValidationError("Percentage rules require percentage + percentage_of_code.")
        if self.computation_type == "formula" and not self.formula:
            raise ValidationError("Formula rules require a formula string.")

    def __str__(self):
        return f"{self.code} ({self.get_computation_type_display()})"


class SalaryStructure(models.Model):
    name = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    rules = models.ManyToManyField(SalaryRule, related_name="structures", blank=True)
    pay_frequency = models.CharField(
        max_length=20,
        choices=[("monthly", "Monthly"), ("biweekly", "Biweekly")],
        default="monthly",
    )

    def ordered_rules(self):
        return self.rules.order_by("sequence")

    def __str__(self):
        return self.name

class Payrun(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("computed", "Computed"),
        ("validated", "Validated"),
        ("paid", "Paid"),
    ]

    name = models.CharField(max_length=100, blank=True)  # e.g. auto-set to "February 2026"
    salary_structure = models.ForeignKey(SalaryStructure, on_delete=models.PROTECT, related_name="payruns")
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Step 2 of the wizard populates this — the actual selected employees.
    # We reference by ID (int) rather than a FK to Person 1's Employee model
    # yet, since that app may not be merged into your branch. Swap this for
    # a real ManyToManyField("core.Employee", ...) once core is available.
    employee_ids = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or f"Payrun {self.period_start} – {self.period_end}"


class Payslip(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("computed", "Computed"),
        ("validated", "Validated"),
        ("paid", "Paid"),
    ]

    payrun = models.ForeignKey(Payrun, on_delete=models.CASCADE, related_name="payslips")

    employee_id = models.IntegerField()
    contract_id = models.IntegerField(null=True, blank=True)

    worked_days = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    warnings = models.JSONField(default=list, blank=True)  # e.g. ["Missing bank details"]

    sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("payrun", "employee_id")  # DB-level guard against duplicate payslips

    def __str__(self):
        return f"Payslip #{self.id} — Employee {self.employee_id}"


class PayslipLine(models.Model):
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name="lines")
    rule_code = models.CharField(max_length=30)
    rule_name = models.CharField(max_length=100)
    category = models.CharField(max_length=20)
    sequence = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["sequence"]

    def __str__(self):
        return f"{self.rule_code}: {self.amount}"