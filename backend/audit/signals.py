from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from .middleware import get_current_user

# Import the models we want to track. This is the ONLY place other
# apps' models get referenced — the tracked models themselves are
# never modified.
from payroll.models import SalaryRule, SalaryStructure, Payrun, Payslip
from core.models import Contract

TRACKED_MODELS = [SalaryRule, SalaryStructure, Payrun, Payslip, Contract]


def _log(instance, action):
    user = get_current_user()
    AuditLog.objects.create(
        model_name=instance.__class__.__name__,
        record_id=str(instance.pk),
        user=user if user and user.is_authenticated else None,
        action=action,
    )


def make_save_handler():
    def handler(sender, instance, created, **kwargs):
        _log(instance, AuditLog.ACTION_CREATE if created else AuditLog.ACTION_UPDATE)
    return handler


def make_delete_handler():
    def handler(sender, instance, **kwargs):
        _log(instance, AuditLog.ACTION_DELETE)
    return handler


for model in TRACKED_MODELS:
    post_save.connect(make_save_handler(), sender=model)
    post_delete.connect(make_delete_handler(), sender=model)