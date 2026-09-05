"""
Tests for the settlement trigger: full & final settlement must flip the
employee's is_active_employee flag to False, record the Settlement, and
fire the employee.offboarded event so audit/notifications can react.
"""
from datetime import date

from django.test import TransactionTestCase

from accounts.models import User, Role
from audit.models import AuditLog
from core.events import event_bus, EVENT_EMPLOYEE_OFFBOARDED
from .models import Settlement
from .services import trigger_settlement


class SettlementTriggerTests(TransactionTestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(name="Admin", level=4)
        self.admin = User.objects.create_user(username="admin1", password="pass12345")
        self.admin.roles.add(self.admin_role)

        self.employee = User.objects.create_user(username="emp1", password="pass12345")
        self.assertTrue(self.employee.is_active_employee)

    def test_trigger_settlement_flips_employee_inactive(self):
        trigger_settlement(self.employee, date(2026, 9, 30), triggered_by=self.admin)

        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active_employee)

    def test_trigger_settlement_creates_computed_settlement_record(self):
        settlement = trigger_settlement(self.employee, date(2026, 9, 30), triggered_by=self.admin)

        self.assertEqual(settlement.status, Settlement.STATUS_COMPUTED)
        self.assertEqual(Settlement.objects.filter(employee=self.employee).count(), 1)

    def test_trigger_settlement_writes_audit_log(self):
        settlement = trigger_settlement(self.employee, date(2026, 9, 30), triggered_by=self.admin)

        entries = AuditLog.objects.filter(model="settlement.settlement", record_id=str(settlement.pk))
        self.assertEqual(entries.count(), 1)
        self.assertEqual(entries.first().action, AuditLog.ACTION_CREATE)

    def test_trigger_settlement_fires_offboarded_event(self):
        received = []
        handler = lambda instance, user=None, **kwargs: received.append(instance)
        event_bus.subscribe(EVENT_EMPLOYEE_OFFBOARDED, handler)

        settlement = trigger_settlement(self.employee, date(2026, 9, 30), triggered_by=self.admin)

        self.assertEqual(len(received), 1)
        self.assertEqual(received[0].pk, settlement.pk)