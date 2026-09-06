import random
from datetime import date, time, timedelta, datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import Employee, Contract, Schedule, Attendance

WORKDAYS = {0, 1, 2, 3, 4}  # Monday-Friday
JOIN_WINDOW_START = date(2026, 1, 1)
JOIN_WINDOW_END = date(2026, 1, 28)

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Kabir",
    "Ananya", "Diya", "Saanvi", "Aadhya", "Myra", "Aarohi", "Anika", "Kiara", "Pari", "Riya",
    "Rohan", "Kunal", "Nikhil", "Varun", "Siddharth", "Rahul", "Amit", "Vikram", "Manish", "Deepak",
    "Sneha", "Pooja", "Neha", "Kavya", "Shreya", "Isha", "Meera", "Tanvi", "Nisha", "Radhika",
    "Arnav", "Dhruv", "Yash", "Aryan", "Devansh", "Harsh", "Om", "Raghav", "Vedant", "Kartik",
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Mehta", "Shah", "Patel", "Iyer", "Nair", "Reddy", "Rao",
    "Kapoor", "Malhotra", "Chopra", "Bhatt", "Joshi", "Desai", "Kulkarni", "Pillai", "Menon", "Agarwal",
    "Bose", "Chatterjee", "Mukherjee", "Banerjee", "Das", "Ghosh", "Pandey", "Mishra", "Tiwari", "Singh",
]

DEPARTMENTS = {
    "Engineering": ["Software Engineer", "Senior Engineer", "QA Engineer", "DevOps Engineer"],
    "AI/ML": ["ML Engineer", "Data Scientist", "Data Analyst"],
    "Cyber sec": ["Security Analyst", "Security Engineer"],
    "Finance": ["Accountant", "Finance Analyst"],
    "GD": ["Designer", "UI/UX Designer"],
    "Sales": ["Sales Executive", "Account Manager"],
    "Marketing": ["Marketing Specialist", "Content Strategist"],
    "Human Resources": ["HR Executive", "Talent Acquisition Specialist"],
    "Support": ["Support Engineer", "Customer Success Associate"],
    "Operations": ["Operations Analyst", "Operations Manager"],
}
SALARY_BANDS = {
    "Engineering": (55000, 110000), "AI/ML": (60000, 120000), "Cyber sec": (58000, 115000),
    "Finance": (40000, 75000), "GD": (38000, 70000), "Sales": (35000, 65000),
    "Marketing": (36000, 68000), "Human Resources": (38000, 70000),
    "Support": (32000, 55000), "Operations": (38000, 72000),
}


class Command(BaseCommand):
    help = (
        "Seeds a bulk batch of employees (default 200) with contracts, working "
        "schedules, and daily attendance, all starting from January 2026 - for "
        "volume/demo data (Kanban boards, lists, dashboards) beyond the small "
        "hand-authored cast in seed_demo_data."
    )

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=200, help="Number of employees to create.")
        parser.add_argument(
            "--start-seq", type=int, default=101,
            help="First numeric suffix for employee IDs (EMP101, EMP102, ...) - "
                 "kept well above the hand-authored EMP002-EMP010 range to avoid collisions.",
        )
        parser.add_argument(
            "--seed", type=int, default=20260101, help="RNG seed, for reproducible runs.",
        )

    def handle(self, *args, **options):
        count = options["count"]
        start_seq = options["start_seq"]
        rng = random.Random(options["seed"])
        today = timezone.localdate()

        created_employees = []
        with transaction.atomic():
            for i in range(count):
                seq = start_seq + i
                employee_id = f"EMP{seq:03d}"
                if Employee.objects.filter(employee_id=employee_id).exists():
                    continue

                first = rng.choice(FIRST_NAMES)
                last = rng.choice(LAST_NAMES)
                department = rng.choice(list(DEPARTMENTS.keys()))
                job_title = rng.choice(DEPARTMENTS[department])
                join_offset = rng.randint(0, (JOIN_WINDOW_END - JOIN_WINDOW_START).days)
                doj = JOIN_WINDOW_START + timedelta(days=join_offset)

                employee = Employee(
                    employee_id=employee_id,
                    first_name=first,
                    last_name=last,
                    email=f"{first.lower()}.{last.lower()}.{seq}@peoplepay-demo.com",
                    phone=f"9{rng.randint(100000000, 999999999)}",
                    department=department,
                    job_title=job_title,
                    date_of_joining=doj,
                    bank_account=str(rng.randint(10 ** 10, 10 ** 12 - 1)),
                    is_active=True,
                    qr_token=f"bulk-{employee_id}-{rng.randrange(10**9)}",
                )
                employee.save()  # not bulk_create: needs its own qr_token, and Contract/Attendance need the PK
                created_employees.append((employee, department))

            for employee, department in created_employees:
                low, high = SALARY_BANDS[department]
                salary = rng.randrange(low, high, 500)
                Contract.objects.create(
                    employee=employee, contract_type="Full-time", start_date=employee.date_of_joining,
                    end_date=None, basic_salary=salary, working_hours_per_week=40, is_active=True,
                )
                self.seed_schedule(employee)

            self.seed_attendance(created_employees, today, rng)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(created_employees)} employees (EMP{start_seq:03d}-EMP{start_seq + count - 1:03d} range), "
            f"each with a contract, a Mon-Fri schedule, and attendance from {JOIN_WINDOW_START} through {today}."
        ))

    def seed_schedule(self, employee):
        rows = []
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]:
            rows.append(Schedule(employee=employee, day_of_week=day, start_time=time(9, 0), end_time=time(18, 0), is_working_day=True))
        for day in ["saturday", "sunday"]:
            rows.append(Schedule(employee=employee, day_of_week=day, start_time=time(9, 0), end_time=time(18, 0), is_working_day=False))
        Schedule.objects.bulk_create(rows)

    def seed_attendance(self, created_employees, today, rng):
        rows = []
        for employee, _department in created_employees:
            cursor = max(employee.date_of_joining, JOIN_WINDOW_START)
            while cursor <= today:
                if cursor.weekday() in WORKDAYS:
                    rows.append(self.build_attendance_row(employee, cursor, rng))
                cursor += timedelta(days=1)
                if len(rows) >= 5000:
                    Attendance.objects.bulk_create(rows)
                    rows = []
        if rows:
            Attendance.objects.bulk_create(rows)

    def build_attendance_row(self, employee, day, rng):
        roll = rng.random()
        if roll < 0.85:
            status = "present"
            check_in = time(8, rng.randint(50, 59)) if rng.random() < 0.3 else time(9, rng.randint(0, 5))
            check_out = time(17, rng.randint(55, 59)) if rng.random() < 0.5 else time(18, rng.randint(0, 10))
        elif roll < 0.93:
            status = "late"
            check_in = time(9, rng.randint(15, 50))
            check_out = time(18, rng.randint(0, 15))
        elif roll < 0.98:
            status = "half_day"
            check_in = time(9, rng.randint(0, 5))
            check_out = time(13, rng.randint(0, 45))
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
