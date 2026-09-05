from django.contrib import admin
from .models import Settlement


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ("employee", "last_working_day", "prorated_basic", "unpaid_leave_encashment_days", "status")