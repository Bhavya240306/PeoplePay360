from django.db import transaction
from django.core.exceptions import ValidationError
from .models import TimeOffRequest, Allocation


@transaction.atomic
def approve_request(request_obj):
    if request_obj.status != TimeOffRequest.STATUS_SUBMITTED:
        raise ValidationError("Only submitted requests can be approved.")

    if request_obj.time_off_type.requires_allocation:
        allocation = (
            Allocation.objects.select_for_update()
            .filter(
                employee=request_obj.employee,
                time_off_type=request_obj.time_off_type,
                status=Allocation.STATUS_APPROVED,
                valid_from__lte=request_obj.date_from,
                valid_to__gte=request_obj.date_to,
            )
            .first()
        )
        if allocation is None:
            raise ValidationError("No valid allocation with sufficient balance found.")
        if allocation.remaining_days < request_obj.duration_days:
            raise ValidationError(
                f"Insufficient balance: {allocation.remaining_days} remaining, "
                f"{request_obj.duration_days} requested."
            )

        allocation.used_days += request_obj.duration_days
        allocation.save()
        request_obj.allocation = allocation

    request_obj.status = TimeOffRequest.STATUS_APPROVED
    request_obj.save()
    return request_obj


@transaction.atomic
def refuse_request(request_obj):
    if request_obj.status != TimeOffRequest.STATUS_SUBMITTED:
        raise ValidationError("Only submitted requests can be refused.")
    request_obj.status = TimeOffRequest.STATUS_REFUSED
    request_obj.save()
    return request_obj