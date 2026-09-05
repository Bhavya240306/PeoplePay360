"""
Tests that the payroll dashboard reflects real created data (per the
spec requirement that it must not be hardcoded/zeros), and enforces
authentication.
"""
from datetime import date
from decimal import Decimal

from django.test import TransactionTestCase
from rest_framework.test import APIClient

from accounts.models import User, Role, Department
from timeoff.models import TimeOffType, Allocation, TimeOffRequest
from timeoff.services import submit_request
from approvals.models import ApprovalPolicy


class DashboardTests(TransactionTestCase):
    def setUp(self):
        self.employee_role = Role.objects.create(name="Employee", level=0)
        ApprovalPolicy.objects.create(process="timeoff", required_levels=[2])

        self.department = Department.objects.create(name="Engineering")
        self.employee = User.objects.create_user(
            username="emp1", password="pass12345", department=self.department
        )
        self.employee.roles.add(self.employee_role)

        self.pto = TimeOffType.objects.create(name="PTO", requires_allocation=True)
        self.allocation = Allocation.objects.create(
            employee=self.employee, time_off_type=self.pto, allocated_days=Decimal("10"),
            period_start=date(2026, 1, 1), period_end=date(2026, 12, 31),
        )
        req = TimeOffRequest.objects.create(
            employee=self.employee, time_off_type=self.pto,
            date_from=date(2026, 9, 10), date_to=date(2026, 9, 12), duration_days=Decimal("3"),
        )
        submit_request(req)

        self.client = APIClient()
        self.client.force_authenticate(self.employee)

    def test_dashboard_requires_authentication(self):
        anon_client = APIClient()
        response = anon_client.get("/api/dashboard/")
        self.assertIn(response.status_code, (401, 403))

    def test_dashboard_returns_real_counts_not_zeros(self):
        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["kpis"]["active_employees"], 1)
        self.assertEqual(data["kpis"]["pending_time_off_requests"], 1)
        self.assertEqual(Decimal(str(data["kpis"]["total_allocated_days"])), Decimal("10"))
        self.assertEqual(data["charts"]["time_off_overview"]["pending"], 1)

        dept_row = next(
            row for row in data["charts"]["department_overview"] if row["name"] == "Engineering"
        )
        self.assertEqual(dept_row["headcount"], 1)

    def test_dashboard_department_filter_excludes_other_departments(self):
        other_department = Department.objects.create(name="Sales")
        response = self.client.get(f"/api/dashboard/?department={other_department.id}")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["kpis"]["pending_time_off_requests"], 0)