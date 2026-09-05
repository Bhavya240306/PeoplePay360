from django.core.management.base import BaseCommand

from accounts.models import Role, Department
from approvals.models import ApprovalPolicy
from timeoff.models import TimeOffType


class Command(BaseCommand):
    help = "Seeds baseline roles, an approval policy, and default leave types so the app is usable out of the box."

    def handle(self, *args, **options):
        # Levels reflect approval authority, not org seniority — a Payroll
        # Admin outranks an HR Manager for payroll-specific gates (e.g.
        # Payrun validation) even though HR Manager sits above them for
        # day-to-day people-management purposes. Adjust here if that's wrong.
        roles = [
            ("Employee", 0),
            ("HR Payroll User", 1),
            ("HR Manager", 2),
            ("HR Payroll Admin", 3),
            ("Admin", 4),
        ]
        for name, level in roles:
            Role.objects.get_or_create(name=name, defaults={"level": level})

        for name in ["Engineering", "Sales", "Finance", "Operations"]:
            Department.objects.get_or_create(name=name)

        # Time off: single approval by a Manager (level 2)
        ApprovalPolicy.objects.get_or_create(process="timeoff", defaults={"required_levels": [2]})
        # Payrun validation gate: Manager, then Finance
        ApprovalPolicy.objects.get_or_create(process="payrun", defaults={"required_levels": [2, 3]})

        TimeOffType.objects.get_or_create(name="Paid Time Off", defaults={"requires_allocation": True, "color": "#4f46e5"})
        TimeOffType.objects.get_or_create(name="Sick Leave", defaults={"requires_allocation": True, "color": "#ef4444"})
        TimeOffType.objects.get_or_create(name="Unpaid Leave", defaults={"requires_allocation": False, "color": "#6b7280"})

        self.stdout.write(self.style.SUCCESS("Baseline roles, departments, approval policies, and leave types seeded."))
