"""
Generic multi-level approval gate, reused by:
  - Time Off requests (this app's own core scope)
  - Payrun validation (Draft -> Compute -> Validate -> Mark Paid; the
    "Validate" gate is where this plugs in for Person 2's payroll flow)

The whole thing is intentionally just: look up how many levels a
process needs, create pending ApprovalStep rows, and let users with a
high-enough Role.level act on the current step. No separate permission
model — it rides entirely on accounts.Role.level.
"""
from django.db import transaction
from django.utils import timezone

from .models import ApprovalPolicy, ApprovalStep


def _target_key(instance):
    return (f"{instance._meta.app_label}.{instance._meta.model_name}", str(instance.pk))


def start_approval(process, instance):
    """
    Creates the pending ApprovalStep chain for `instance` per the
    configured ApprovalPolicy. Returns the list of created steps (empty
    list if the process needs no approval at all — caller should treat
    that as "auto-approved").
    """
    try:
        policy = ApprovalPolicy.objects.get(process=process)
    except ApprovalPolicy.DoesNotExist:
        return []

    model_label, record_id = _target_key(instance)
    steps = []
    for index, level in enumerate(policy.required_levels):
        step, _ = ApprovalStep.objects.get_or_create(
            process=process, target_model=model_label, target_record_id=record_id,
            step_index=index, defaults={"required_level": level},
        )
        steps.append(step)
    return steps


def current_step(process, instance):
    model_label, record_id = _target_key(instance)
    return (
        ApprovalStep.objects.filter(
            process=process, target_model=model_label, target_record_id=record_id,
            status=ApprovalStep.STATUS_PENDING,
        )
        .order_by("step_index")
        .first()
    )


def is_fully_approved(process, instance):
    model_label, record_id = _target_key(instance)
    steps = ApprovalStep.objects.filter(process=process, target_model=model_label, target_record_id=record_id)
    if not steps.exists():
        return True  # no policy configured for this process -> nothing to gate on
    return not steps.exclude(status=ApprovalStep.STATUS_APPROVED).exists()


def was_rejected(process, instance):
    model_label, record_id = _target_key(instance)
    return ApprovalStep.objects.filter(
        process=process, target_model=model_label, target_record_id=record_id,
        status=ApprovalStep.STATUS_REJECTED,
    ).exists()


class ApprovalError(Exception):
    pass


@transaction.atomic
def act_on_step(process, instance, user, approve: bool, reason=""):
    """
    The "thin state check": is `user`'s highest role level >= this
    step's required_level? If yes, mark it approved/rejected and
    return whether the whole chain is now finished.
    """
    # Self-approval guard: applies to any target that has an `employee`
    # field (TimeOffRequest today; anything else routed through this
    # gate later gets the same protection for free). Targets without
    # that field (e.g. a Payrun covering many employees) skip this check.
    target_employee = getattr(instance, "employee", None)
    if target_employee is not None and target_employee.pk == user.pk:
        raise ApprovalError("You cannot approve or reject your own request.")

    step = current_step(process, instance)
    if step is None:
        raise ApprovalError("No pending approval step for this record.")

    if user.highest_role_level() < step.required_level:
        raise ApprovalError("You do not have sufficient role level to act on this approval step.")

    step.status = ApprovalStep.STATUS_APPROVED if approve else ApprovalStep.STATUS_REJECTED
    step.acted_by = user
    step.acted_at = timezone.now()
    step.reason = reason
    step.save()

    return {
        "step_approved": approve,
        "fully_approved": is_fully_approved(process, instance) if approve else False,
        "rejected": not approve,
    }
