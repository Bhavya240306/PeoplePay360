from django.contrib import admin
from .models import ApprovalPolicy, ApprovalStep

admin.site.register(ApprovalPolicy)
admin.site.register(ApprovalStep)
