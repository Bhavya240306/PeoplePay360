from django.contrib import admin
from .models import TimeOffType, Allocation, TimeOffRequest


@admin.register(TimeOffType)
class TimeOffTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "requires_allocation", "requires_approval", "affects_payroll", "is_active")


@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ("employee", "time_off_type", "allocated_days", "used_days", "remaining_days", "status")
    list_filter = ("time_off_type", "status")


@admin.register(TimeOffRequest)
class TimeOffRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "time_off_type", "date_from", "date_to", "duration_days", "status")
    list_filter = ("time_off_type", "status")