"""
Drop-in mixins so any app's model/serializer gets audit logging for free.

Model side (captures field-level diffs on save, including from the
Django admin or shell, not just the API):

    class Contract(AuditableModel):
        AUDITED_FIELDS = ["wage", "state", "salary_structure_id"]
        ...

Serializer side (captures who made the change and its reason via a DRF
request, and is what viewsets should actually use since it has access
to `request.user`):

    class ContractSerializer(AuditLoggingSerializerMixin, serializers.ModelSerializer):
        AUDITED_FIELDS = ["wage", "state"]
"""
from .services import log_change, diff_fields
from .models import AuditLog


class AuditableModel:
    """Mixin for plain Django models (no request/user context available)."""
    AUDITED_FIELDS = []  # override in subclass

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._audit_snapshot = self._snapshot()

    def _snapshot(self):
        return {f: getattr(self, f, None) for f in self.AUDITED_FIELDS}

    def save(self, *args, user=None, **kwargs):
        is_new = self._state.adding
        old_values = {} if is_new else self._audit_snapshot
        super().save(*args, **kwargs)
        new_values = self._snapshot()
        if is_new:
            log_change(self, user, AuditLog.ACTION_CREATE, diff=new_values)
        else:
            changed = diff_fields(old_values, new_values)
            if changed:
                log_change(self, user, AuditLog.ACTION_UPDATE, diff=changed)
        self._audit_snapshot = new_values


class AuditLoggingSerializerMixin:
    """Mixin for DRF ModelSerializers, logging via request.user."""
    AUDITED_FIELDS = []  # override in subclass; empty = log all validated_data fields

    def _fields_of_interest(self, values: dict):
        if not self.AUDITED_FIELDS:
            return values
        return {k: v for k, v in values.items() if k in self.AUDITED_FIELDS}

    def _request_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None) if request else None

    def create(self, validated_data):
        instance = super().create(validated_data)
        log_change(
            instance, self._request_user(), AuditLog.ACTION_CREATE,
            diff=self._fields_of_interest(validated_data),
        )
        return instance

    def update(self, instance, validated_data):
        old_values = {f: getattr(instance, f, None) for f in validated_data.keys()}
        updated = super().update(instance, validated_data)
        new_values = {f: getattr(updated, f, None) for f in validated_data.keys()}
        changed = diff_fields(old_values, new_values)
        if changed:
            log_change(updated, self._request_user(), AuditLog.ACTION_UPDATE, diff=changed)
        return updated
