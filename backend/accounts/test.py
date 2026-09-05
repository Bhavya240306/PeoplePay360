"""
Tests for the Admin/User Management access control: only users with the
Admin role may create/edit Users, Roles, or Departments through the API.
Everyone authenticated can still read (GET) per IsAdminRole.
"""
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from .models import User, Role, Department


class UserManagementPermissionTests(TransactionTestCase):
    def setUp(self):
        self.employee_role = Role.objects.create(name="Employee", level=0)
        self.admin_role = Role.objects.create(name="Admin", level=4)

        self.employee = User.objects.create_user(username="emp1", password="pass12345")
        self.employee.roles.add(self.employee_role)

        self.admin = User.objects.create_user(username="admin1", password="pass12345")
        self.admin.roles.add(self.admin_role)

        self.client = APIClient()

    def test_non_admin_gets_403_on_post_users(self):
        self.client.force_authenticate(self.employee)
        response = self.client.post(
            "/api/users/",
            {"username": "newhire", "password": "irrelevant"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(username="newhire").exists())

    def test_admin_can_post_users(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/users/",
            {"username": "newhire", "password": "irrelevant"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username="newhire").exists())

    def test_non_admin_can_still_read_users(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, 200)

    def test_anonymous_is_blocked_entirely(self):
        response = self.client.get("/api/users/")
        self.assertIn(response.status_code, (401, 403))