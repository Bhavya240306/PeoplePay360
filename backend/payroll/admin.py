from django.contrib import admin
from .models import SalaryRule, SalaryStructure
from .models import Payrun, Payslip, PayslipLine

@admin.register(SalaryRule)
class SalaryRuleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "sequence", "computation_type", "active")
    ordering = ("sequence",)


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ("name", "active", "pay_frequency")
    filter_horizontal = ("rules",)


admin.site.register(Payrun)
admin.site.register(Payslip)
admin.site.register(PayslipLine)