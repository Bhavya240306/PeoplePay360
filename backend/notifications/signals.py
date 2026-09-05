from django.db.models.signals import post_save
from django.dispatch import receiver
from timeoff.models import TimeOffRequest
from payroll.models import Payslip
from core.models import Employee
from .services import notify_employee

# Track previous status so we only notify on actual transitions,
# not on every save (e.g. re-saving a draft shouldn't spam a notification).
_previous_status = {}


@receiver(post_save, sender=TimeOffRequest)
def notify_on_timeoff_decision(sender, instance, created, **kwargs):
    if created:
        return
    prev = _previous_status.get(instance.pk)
    if instance.status == "approved" and prev != "approved":
        notify_employee(instance.employee, "timeoff_approved",
                         f"Your leave request ({instance.date_from} to {instance.date_to}) was approved.")
    elif instance.status == "refused" and prev != "refused":
        notify_employee(instance.employee, "timeoff_refused",
                         f"Your leave request ({instance.date_from} to {instance.date_to}) was refused.")
    _previous_status[instance.pk] = instance.status


@receiver(post_save, sender=Payslip)
def notify_on_payslip_generated(sender, instance, created, **kwargs):
    prev = _previous_status.get(f"payslip_{instance.pk}")
    if instance.status == "computed" and prev != "computed":
        try:
            employee = Employee.objects.get(pk=instance.employee_id)
            notify_employee(employee, "payslip_generated",
                             f"Your payslip for period {instance.payrun.period_start} is ready.")
        except Employee.DoesNotExist:
            pass
    _previous_status[f"payslip_{instance.pk}"] = instance.status