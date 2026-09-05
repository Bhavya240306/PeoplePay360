"""
URL configuration for peoplepay360 project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/payroll/", include("payroll.urls")),
    path("api/", include("core.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/timeoff/", include("timeoff.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/audit/", include("audit.urls")),
]