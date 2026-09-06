from django.contrib.auth.models import User
from rest_framework import serializers
from core.models import (
    Employee, employee_id_validator, person_name_validator, phone_validator, bank_account_validator,
)
from core.serializers import EmployeeSerializer
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    employee_detail = EmployeeSerializer(source="employee", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["id", "username", "email", "role", "role_display", "employee", "employee_detail"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.IntegerField(write_only=True, default=UserProfile.ROLE_EMPLOYEE)
    first_name = serializers.CharField(required=True, validators=[person_name_validator])
    last_name = serializers.CharField(
        required=False, allow_blank=True, default="", validators=[person_name_validator]
    )

    employee_id = serializers.CharField(
        write_only=True, required=False, allow_blank=True, default="", validators=[employee_id_validator]
    )
    phone = serializers.CharField(
        write_only=True, required=False, allow_blank=True, default="", validators=[phone_validator]
    )
    department = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    job_title = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    date_of_joining = serializers.DateField(write_only=True, required=False, allow_null=True, default=None)
    bank_account = serializers.CharField(
        write_only=True, required=False, allow_blank=True, default="", validators=[bank_account_validator]
    )

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "password", "role", "first_name", "last_name",
            "employee_id", "phone", "department", "job_title", "date_of_joining", "bank_account",
        ]

    def validate(self, attrs):
        if attrs.get("role") == UserProfile.ROLE_EMPLOYEE:
            employee_id = attrs.get("employee_id")
            if not employee_id:
                raise serializers.ValidationError({"employee_id": "Required when role is Employee."})
            if Employee.objects.filter(employee_id=employee_id).exists():
                raise serializers.ValidationError({"employee_id": "An employee with this ID already exists."})
            if not attrs.get("date_of_joining"):
                raise serializers.ValidationError({"date_of_joining": "Required when role is Employee."})
        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")
        employee_fields = {
            "employee_id": validated_data.pop("employee_id"),
            "phone": validated_data.pop("phone"),
            "department": validated_data.pop("department"),
            "job_title": validated_data.pop("job_title"),
            "date_of_joining": validated_data.pop("date_of_joining"),
            "bank_account": validated_data.pop("bank_account"),
        }

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if role == UserProfile.ROLE_EMPLOYEE:
            employee = Employee.objects.create(
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                **employee_fields,
            )
            user.profile.employee = employee

        user.profile.role = role
        user.profile.save()
        return user