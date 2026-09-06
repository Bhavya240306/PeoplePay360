from rest_framework import serializers
from .models import SalaryRule, SalaryStructure
from .models import Payrun, Payslip, PayslipLine


class SalaryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryRule
        fields = "__all__"
        # sequence is never client-supplied - it's auto-assigned from the
        # rule's category priority band (see SalaryRuleViewSet.perform_create).
        read_only_fields = ["sequence"]

    def validate(self, data):
        instance = SalaryRule(**data)
        try:
            instance.clean()
        except Exception as e:
            raise serializers.ValidationError(str(e))
        return data


class SalaryStructureSerializer(serializers.ModelSerializer):
    rules = SalaryRuleSerializer(many=True, read_only=True)
    rule_ids = serializers.PrimaryKeyRelatedField(
        queryset=SalaryRule.objects.all(), many=True, write_only=True, source="rules"
    )

    class Meta:
        model = SalaryStructure
        fields = ["id", "name", "active", "pay_frequency", "rules", "rule_ids"]


class PayslipLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayslipLine
        fields = ["id", "rule_code", "rule_name", "category", "sequence", "amount"]


class PayrunMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payrun
        fields = ["id", "name", "period_start", "period_end", "status"]


class PayslipSerializer(serializers.ModelSerializer):
    lines = PayslipLineSerializer(many=True, read_only=True)
    payrun_detail = PayrunMiniSerializer(source="payrun", read_only=True)

    class Meta:
        model = Payslip
        fields = [
            "id", "payrun", "payrun_detail", "employee_id", "contract_id",
            "worked_days", "status", "warnings", "sent_at", "lines",
        ]


class PayrunSerializer(serializers.ModelSerializer):
    payslips = PayslipSerializer(many=True, read_only=True)

    class Meta:
        model = Payrun
        fields = [
            "id", "name", "salary_structure", "period_start", "period_end",
            "status", "employee_ids", "created_at", "payslips",
        ]
        read_only_fields = ["status", "employee_ids", "created_at"]
        # employee_ids is read-only here on purpose — it's NOT set via a normal
        # PUT/PATCH. It's only set through the dedicated "select employees"
        # action below, which is what actually creates the Payrun.