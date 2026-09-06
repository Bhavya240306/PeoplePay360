import random
from datetime import date, time, timedelta, datetime

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import UserProfile
from core.models import Employee, Contract, Schedule, Attendance
from payroll.models import SalaryRule, SalaryStructure
from payroll.services import generate_monthly_payruns
from timeoff.models import TimeOffType, Allocation, TimeOffRequest
from timeoff.services import approve_request, refuse_request

DEFAULT_PASSWORD = "Passw0rd!123"
ATTENDANCE_START = date(2026, 1, 1)
WORKDAYS = {0, 1, 2, 3, 4}  # Monday-Friday

RNG = random.Random(20260101)

# (employee_id, first, last, email, dept, job_title, doj, bank_account,
#  contract_start, contract_end, basic_salary)
EMPLOYEE_PLAN = [
    dict(
        employee_id="EMP002", first="Nency", last="Raiyani",
        email="nency-superwoman@gmail.com", department="AI/ML", job_title="Data Analyst",
        doj=date(2025, 8, 1), bank_account="EMP002BANK0001",
        username="Nency", contracts=[(date(2025, 8, 1), None, 60000)],
    ),
    dict(
        employee_id="EMP004", first="Prachi", last="Thakkar",
        email="aprachithakkar1010@gmail.com", department="GD", job_title="Designer",
        doj=date(2025, 11, 1), bank_account="0123456",
        username="Prachi", contracts=[(date(2026, 2, 1), None, 52000)],
        # Her Dec 2025 - Jan 2026 contract already exists in the DB; we only add the follow-on.
    ),
    dict(
        employee_id="EMP005", first="Rohan", last="Mehta",
        email="rohan.mehta@example.com", department="Engineering", job_title="Software Engineer",
        doj=date(2025, 6, 1), bank_account="EMP005BANK0001",
        username="Rohan", contracts=[(date(2025, 6, 1), date(2026, 6, 15), 55000)],
        # Contract intentionally ends mid-month, mid-year - demonstrates the
        # "contract ends mid-month" prorated payslip path, and he has no
        # renewal afterwards (no applicable contract from July 2026 on).
    ),
    dict(
        employee_id="EMP006", first="Ananya", last="Iyer",
        email="ananya.iyer@example.com", department="Sales", job_title="Sales Executive",
        doj=date(2025, 4, 1), bank_account="EMP006BANK0001",
        username="Ananya", contracts=[(date(2025, 4, 1), None, 42000)],
    ),
    dict(
        employee_id="EMP007", first="Karan", last="Verma",
        email="karan.verma@example.com", department="Finance", job_title="Accountant",
        doj=date(2025, 7, 15), bank_account="EMP007BANK0001",
        username="Karan", contracts=[(date(2025, 7, 15), None, 48000)],
    ),
    dict(
        employee_id="EMP008", first="Priya", last="Nair",
        email="priya.nair@example.com", department="Marketing", job_title="Marketing Specialist",
        doj=date(2025, 9, 1), bank_account="EMP008BANK0001",
        username="Priya", contracts=[(date(2025, 9, 1), None, 40000)],
    ),
    dict(
        employee_id="EMP009", first="Aditya", last="Rao",
        email="aditya.rao@example.com", department="Human Resources", job_title="HR Executive",
        doj=date(2025, 5, 1), bank_account="EMP009BANK0001",
        username="Aditya", contracts=[(date(2025, 5, 1), None, 45000)],
    ),
]


class Command(BaseCommand):
    help = "Seeds a rich demo dataset: employees, logins, schedules, contracts, attendance (from Jan 2026), leave, and historical payslips."

    def handle(self, *args, **options):
        today = timezone.localdate()
        with transaction.atomic():
            self.ensure_salary_rules()
            credentials = []
            for plan in EMPLOYEE_PLAN:
                employee = self.ensure_employee(plan)
                self.ensure_user(plan, employee, credentials)
                self.ensure_schedule(employee)
                last_bound = self.ensure_contracts(employee, plan)
                self.ensure_attendance(employee, today, last_bound)

            self.ensure_timeoff_types()
            for plan in EMPLOYEE_PLAN:
                employee = Employee.objects.get(employee_id=plan["employee_id"])
                self.ensure_allocations_and_requests(employee)

            self.generate_history(today)

        self.stdout.write(self.style.SUCCESS("\nSeed complete. Login credentials:"))
        self.stdout.write(f"{'Username':<12} {'Password':<16} {'Role':<20} Employee")
        for row in credentials:
            self.stdout.write(f"{row[0]:<12} {row[1]:<16} {row[2]:<20} {row[3]}")

    # -- Salary rules -----------------------------------------------------

    def ensure_salary_rules(self):
        ta, _ = SalaryRule.objects.update_or_create(
            code="TA",
            defaults=dict(name="Transport Allowance", category="allowance", sequence=15,
                          computation_type="fixed", amount=2000, active=True),
        )
        pt, _ = SalaryRule.objects.update_or_create(
            code="PT",
            defaults=dict(name="Professional Tax", category="deduction", sequence=35,
                          computation_type="fixed", amount=200, active=True),
        )
        gross = SalaryRule.objects.get(code="GROSS")
        gross.formula = "BASIC + HRA + TA"
        gross.save()
        net = SalaryRule.objects.get(code="NET")
        net.formula = "GROSS - PF - PT"
        net.save()

        structure = SalaryStructure.objects.filter(active=True).first()
        if structure:
            structure.rules.add(ta, pt)

    # -- Employees & users --------------------------------------------------

    def ensure_employee(self, plan):
        employee, _ = Employee.objects.update_or_create(
            employee_id=plan["employee_id"],
            defaults=dict(
                first_name=plan["first"], last_name=plan["last"], email=plan["email"],
                department=plan["department"], job_title=plan["job_title"],
                date_of_joining=plan["doj"], bank_account=plan["bank_account"],
                is_active=True,
            ),
        )
        return employee

    def ensure_user(self, plan, employee, credentials):
        username = plan["username"]
        user, created = User.objects.get_or_create(
            username=username,
            defaults=dict(email=plan["email"], first_name=plan["first"], last_name=plan["last"]),
        )
        user.set_password(DEFAULT_PASSWORD)
        user.save()
        user.profile.role = UserProfile.ROLE_EMPLOYEE
        user.profile.employee = employee
        user.profile.save()
        credentials.append((username, DEFAULT_PASSWORD, "Employee", f"{employee.employee_id} {employee.first_name} {employee.last_name}"))

    # -- Schedule ------------------------------------------------------------

    def ensure_schedule(self, employee):
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]:
            Schedule.objects.get_or_create(
                employee=employee, day_of_week=day,
                defaults=dict(start_time=time(9, 0), end_time=time(18, 0), is_working_day=True),
            )
        for day in ["saturday", "sunday"]:
            Schedule.objects.get_or_create(
                employee=employee, day_of_week=day,
                defaults=dict(start_time=time(9, 0), end_time=time(18, 0), is_working_day=False),
            )

    # -- Contracts ------------------------------------------------------------

    def ensure_contracts(self, employee, plan):
        """Creates any missing contracts for this employee and returns the
        date attendance generation should stop at (the last contract's
        end_date if it has one and it's in the past, else None = today)."""
        last_end_bound = None
        for start, end, salary in plan["contracts"]:
            Contract.objects.get_or_create(
                employee=employee, start_date=start,
                defaults=dict(contract_type="Full-time", end_date=end,
                              basic_salary=salary, working_hours_per_week=40, is_active=True),
            )
            if end is not None:
                last_end_bound = end
        # If the employee's most recent contract (by start_date) has an
        # end_date, attendance shouldn't run past it.
        latest = Contract.objects.filter(employee=employee).order_by("-start_date").first()
        if latest and latest.end_date:
            return latest.end_date
        return None

    # -- Attendance -----------------------------------------------------------

    def ensure_attendance(self, employee, today, last_bound):
        end_date = min(today, last_bound) if last_bound else today
        if end_date < ATTENDANCE_START:
            return

        existing_dates = set(
            Attendance.objects.filter(employee=employee, date__gte=ATTENDANCE_START, date__lte=end_date)
            .values_list("date", flat=True)
        )

        cursor = ATTENDANCE_START
        new_rows = []
        while cursor <= end_date:
            if cursor.weekday() in WORKDAYS and cursor not in existing_dates:
                new_rows.append(self.build_attendance_row(employee, cursor))
            cursor += timedelta(days=1)

        if new_rows:
            Attendance.objects.bulk_create(new_rows)

    def build_attendance_row(self, employee, day):
        roll = RNG.random()
        if roll < 0.85:
            status = "present"
            check_in = time(8, RNG.randint(50, 59)) if RNG.random() < 0.3 else time(9, RNG.randint(0, 5))
            check_out = time(17, RNG.randint(55, 59)) if RNG.random() < 0.5 else time(18, RNG.randint(0, 10))
        elif roll < 0.93:
            status = "late"
            check_in = time(9, RNG.randint(15, 50))
            check_out = time(18, RNG.randint(0, 15))
        elif roll < 0.98:
            status = "half_day"
            check_in = time(9, RNG.randint(0, 5))
            check_out = time(13, RNG.randint(0, 45))
        else:
            status = "absent"
            check_in = None
            check_out = None

        if check_in and check_out:
            worked_seconds = (datetime.combine(day, check_out) - datetime.combine(day, check_in)).total_seconds()
            worked_hours = round(max(worked_seconds, 0) / 3600, 2)
        else:
            worked_hours = 0

        return Attendance(
            employee=employee, date=day, check_in=check_in, check_out=check_out,
            status=status, worked_hours=worked_hours,
        )

    # -- Time off ---------------------------------------------------------------

    def ensure_timeoff_types(self):
        TimeOffType.objects.get_or_create(
            name="Sick Leave",
            defaults=dict(requires_allocation=True, requires_approval=True, affects_payroll=False, is_active=True),
        )
        TimeOffType.objects.get_or_create(
            name="Unpaid Leave",
            defaults=dict(requires_allocation=False, requires_approval=True, affects_payroll=True, is_active=True),
        )

    def ensure_allocations_and_requests(self, employee):
        annual = TimeOffType.objects.get(name="Annual Leave")
        sick = TimeOffType.objects.get(name="Sick Leave")

        Allocation.objects.get_or_create(
            employee=employee, time_off_type=annual, valid_from=date(2026, 1, 1),
            defaults=dict(allocated_days=20, used_days=0, valid_to=date(2026, 12, 31), status="approved"),
        )
        Allocation.objects.get_or_create(
            employee=employee, time_off_type=sick, valid_from=date(2026, 1, 1),
            defaults=dict(allocated_days=10, used_days=0, valid_to=date(2026, 12, 31), status="approved"),
        )

        # (type, date_from, date_to, final_status)
        sample_requests = [
            (annual, date(2026, 2, 10), date(2026, 2, 12), "approved"),
            (sick, date(2026, 5, 5), date(2026, 5, 5), "refused"),
            (annual, date(2026, 9, 15), date(2026, 9, 16), "submitted"),
        ]
        for time_off_type, date_from, date_to, final_status in sample_requests:
            duration = (date_to - date_from).days + 1
            req, created = TimeOffRequest.objects.get_or_create(
                employee=employee, time_off_type=time_off_type, date_from=date_from,
                defaults=dict(date_to=date_to, duration_days=duration, status="submitted",
                              reason="Personal"),
            )
            if not created:
                continue
            if final_status == "approved":
                approve_request(req)
            elif final_status == "refused":
                refuse_request(req)

    # -- Historical payslips -------------------------------------------------

    def generate_history(self, today):
        month_cursor = date(2026, 1, 1)
        while month_cursor <= today.replace(day=1):
            generate_monthly_payruns(reference_date=month_cursor)
            if month_cursor.month == 12:
                month_cursor = month_cursor.replace(year=month_cursor.year + 1, month=1)
            else:
                month_cursor = month_cursor.replace(month=month_cursor.month + 1)
