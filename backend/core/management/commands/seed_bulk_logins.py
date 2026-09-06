from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import UserProfile
from core.models import Employee

DEFAULT_PASSWORD = "Passw0rd!123"


class Command(BaseCommand):
    help = (
        "Creates an Employee-role login for every core.Employee that doesn't "
        "have one yet (username = employee_id), all sharing one password. "
        "Meant to follow seed_bulk_employees, which only creates the HR "
        "records, not accounts."
    )

    def add_arguments(self, parser):
        parser.add_argument("--password", default=DEFAULT_PASSWORD)
        parser.add_argument(
            "--prefix", default=None,
            help="Only create logins for employee_ids starting with this prefix, e.g. EMP1.",
        )

    def handle(self, *args, **options):
        password = options["password"]
        prefix = options["prefix"]

        qs = Employee.objects.filter(user_profile__isnull=True).order_by("employee_id")
        if prefix:
            qs = qs.filter(employee_id__startswith=prefix)

        created_usernames = []
        with transaction.atomic():
            for employee in qs:
                username = employee.employee_id
                user, _ = User.objects.get_or_create(
                    username=username,
                    defaults=dict(
                        email=employee.email, first_name=employee.first_name, last_name=employee.last_name,
                    ),
                )
                user.set_password(password)
                user.save()
                user.profile.role = UserProfile.ROLE_EMPLOYEE
                user.profile.employee = employee
                user.profile.save()
                created_usernames.append(username)

        self.stdout.write(self.style.SUCCESS(
            f"Created/updated {len(created_usernames)} login accounts. Password for all: {password}"
        ))
        if created_usernames:
            self.stdout.write(f"Usernames: {created_usernames[0]} .. {created_usernames[-1]}")
