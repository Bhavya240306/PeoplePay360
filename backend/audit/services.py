"""
The single write path for the audit trail. Every other app should call
`log_change()` (directly, or via the DRF mixin below / the model mixin
in `audit/model_mixin.py`) instead of creating AuditLog rows itself —
that keeps the diff format consistent everywhere it shows up in the
reusable "History" tab component.
"""
from .models import AuditLog


def model_label(instance):
    return f"{instance._meta.app_label}.{instance._meta.model_name}"


def diff_fields(old_values: dict, new_values: dict) -> dict:
    """old_values/new_values: {field_name: value}. Returns only changed fields."""
    changed = {}
    for field, new_val in new_values.items():
        old_val = old_values.get(field)
        if old_val != new_val:
            changed[field] = [old_val, new_val]
    return changed


def log_change(instance, user, action, diff=None, reason=""):
    return AuditLog.objects.create(
        model=model_label(instance),
        record_id=str(instance.pk),
        user=user if (user and getattr(user, "is_authenticated", True)) else None,
        action=action,
        diff=diff or {},
        reason=reason,
    )


def history_for(model_label_str, record_id):
    """Used by the reusable History tab: GET /audit/?model=timeoff.timeoffrequest&record_id=12"""
    return AuditLog.objects.filter(model=model_label_str, record_id=str(record_id))
