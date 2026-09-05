from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Role, Department


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "level"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    """
    Backs the Admin/User Management screen. `role_ids` is what the
    checkbox UI posts (list of Role pks); `roles` is the read-only
    expanded representation shown back to the UI.
    """
    role_ids = serializers.PrimaryKeyRelatedField(
        source="roles", queryset=Role.objects.all(), many=True, write_only=True, required=False
    )
    roles = RoleSerializer(many=True, read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        source="department", queryset=Department.objects.all(),
        write_only=True, required=False, allow_null=True
    )
    department = DepartmentSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "email",
            "employee_id", "department", "department_id",
            "roles", "role_ids", "is_active_employee", "is_active", "password",
        ]

    def create(self, validated_data):
        roles = validated_data.pop("roles", [])
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        if roles:
            user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance
