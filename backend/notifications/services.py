def notify(recipient, event_type, message, related_object=None):
    from .models import Notification
    kwargs = dict(recipient=recipient, event_type=event_type, message=message)
    if related_object is not None:
        kwargs["related_model"] = f"{related_object._meta.app_label}.{related_object._meta.model_name}"
        kwargs["related_record_id"] = str(related_object.pk)
    return Notification.objects.create(**kwargs)
