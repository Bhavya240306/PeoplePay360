from django.contrib import admin
from .models import TimeOffType, Allocation, TimeOffRequest

admin.site.register(TimeOffType)
admin.site.register(Allocation)
admin.site.register(TimeOffRequest)
