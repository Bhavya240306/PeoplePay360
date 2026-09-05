from django.urls import path
from .views import payroll_dashboard

urlpatterns = [
    path("dashboard/", payroll_dashboard, name="payroll-dashboard"),
]
