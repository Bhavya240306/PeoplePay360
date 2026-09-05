from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date
from core.models import Employee
from .services import process_settlement
from .models import Settlement

_previous_active_state = {}


@receiver(post_save, sender=Employee)
def trigger_settlement_on_termination(sender, instance, created, **kwargs):
    if created:
        _previous_active_state[instance.pk] = instance.is_active
        return

    was_active = _previous_active_state.get(instance.pk, True)
    if was_active and not instance.is_active:
        # Employee was just deactivated — auto-trigger settlement,
        # unless one already exists for them.
        if not Settlement.objects.filter(employee=instance).exists():
            try:
                process_settlement(instance, last_working_day=date.today())
            except ValueError:
                pass  # no contract/structure available — silently skip, don't crash the save

    _previous_active_state[instance.pk] = instance.is_active