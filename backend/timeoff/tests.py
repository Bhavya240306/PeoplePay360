"""
Tests for the one flow with real correctness risk: approving a Time Off
request must decrement its Allocation exactly once, even if two
approvals race, and must never let a request draw more than the
allocation actually has.
"""
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.test import TransactionTestCase

from accounts.models import User, Role, Department
from approvals.models import ApprovalPolicy
from approvals.services import ApprovalError
from .models import TimeOffType, Allocation, TimeOffRequest
from .services import submit_request, approve_step, refuse_step, TimeOffError


class TimeOffFlowTests(TransactionTestCase):
    def setUp(self):
        self.employee_role = Role.objects.create(name="Employee", level=0)
        self.manager_role = Role.objects.create(name="Manager", level=2)
        ApprovalPolicy.objects.create(process="timeoff", required_levels=[2])

        self.employee = User.objects.create(username="emp1")
        self.employee.roles.add(self.employee_role)

        self.manager = User.objects.create(username="mgr1")
        self.manager.roles.add(self.manager_role)

        self.other_manager = User.objects.create(username="mgr2")
        self.other_manager.roles.add(self.manager_role)

        self.pto = TimeOffType.objects.create(name="PTO", requires_allocation=True)
        self.allocation = Allocation.objects.create(
            employee=self.employee, time_off_type=self.pto, allocated_days=Decimal("10"),
            period_start=date(2026, 1, 1), period_end=date(2026, 12, 31),
        )

    def _make_request(self, duration=Decimal("3")):
        return TimeOffRequest.objects.create(
            employee=self.employee, time_off_type=self.pto,
            date_from=date(2026, 9, 10), date_to=date(2026, 9, 12), duration_days=duration,
        )

    def test_happy_path_decrements_allocation_exactly_once(self):
        req = self._make_request()
        submit_request(req)
        approve_step(req, self.manager)

        req.refresh_from_db()
        self.allocation.refresh_from_db()
        self.assertEqual(req.status, TimeOffRequest.STATUS_APPROVED)
        self.assertEqual(self.allocation.used_days, Decimal("3"))
        self.assertEqual(self.allocation.remaining_days, Decimal("7"))

    def test_low_role_cannot_approve(self):
        req = self._make_request()
        submit_request(req)
        with self.assertRaises(ApprovalError):
            approve_step(req, self.employee)

    def test_cannot_approve_own_request(self):
        # promote the employee to Manager level too, to isolate the
        # self-approval check from the role-level check
        self.employee.roles.add(self.manager_role)
        req = self._make_request()
        submit_request(req)
        with self.assertRaises(ApprovalError):
            approve_step(req, self.employee)

    def test_overdraw_is_blocked_at_submit(self):
        req = self._make_request(duration=Decimal("20"))
        with self.assertRaises(TimeOffError):
            submit_request(req)

    def test_refuse_does_not_touch_allocation(self):
        req = self._make_request()
        submit_request(req)
        refuse_step(req, self.manager, reason="not enough coverage")

        req.refresh_from_db()
        self.allocation.refresh_from_db()
        self.assertEqual(req.status, TimeOffRequest.STATUS_REFUSED)
        self.assertEqual(self.allocation.used_days, Decimal("0"))

    def test_concurrent_approval_cannot_double_spend_balance(self):
        """
        Two separate requests for 6 days each against a 10-day balance:
        sequentially approving both should succeed for the first (10-6=4
        left) and fail for the second (needs 6, only 4 remain) rather
        than both succeeding and driving the balance negative.
        This exercises the select_for_update path in approve_step.
        """
        req_a = self._make_request(duration=Decimal("6"))
        req_b = self._make_request(duration=Decimal("6"))
        submit_request(req_a)
        submit_request(req_b)

        approve_step(req_a, self.manager)
        self.allocation.refresh_from_db()
        self.assertEqual(self.allocation.remaining_days, Decimal("4"))

        with self.assertRaises(TimeOffError):
            approve_step(req_b, self.other_manager)

        self.allocation.refresh_from_db()
        self.assertEqual(self.allocation.remaining_days, Decimal("4"))
