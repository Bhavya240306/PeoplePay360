from django.contrib import admin
from .models import Employee, Contract, Attendance, Schedule


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "department",
        "job_title",
        "date_of_joining",
        "is_active",
    )
    search_fields = (
        "employee_id",
        "first_name",
        "last_name",
        "email",
    )
    list_filter = ("department", "is_active")


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "contract_type",
        "start_date",
        "end_date",
        "basic_salary",
        "is_active",
    )
    search_fields = ("employee__employee_id",)
    list_filter = ("contract_type", "is_active")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "date",
        "check_in",
        "check_out",
        "status",
        "worked_hours",
    )
    search_fields = ("employee__employee_id",)
    list_filter = ("status", "date")


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "day_of_week",
        "start_time",
        "end_time",
        "is_working_day",
        "location",
    )
    search_fields = ("employee__employee_id",)
    list_filter = ("day_of_week", "is_working_day")