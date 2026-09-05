from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SalaryRule, SalaryStructure, Payrun, Payslip
from .serializers import SalaryRuleSerializer, SalaryStructureSerializer, PayrunSerializer, PayslipSerializer


class SalaryRuleViewSet(viewsets.ModelViewSet):
    queryset = SalaryRule.objects.all()
    serializer_class = SalaryRuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]

class PayrunViewSet(viewsets.ModelViewSet):
    queryset = Payrun.objects.all()
    serializer_class = PayrunSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Step 1: create the scope only (structure + period). Status stays "draft".
    # This is just the default `create()` from ModelViewSet — no override needed,
    # since employee_ids defaults to [] and status defaults to "draft" already.

    @action(detail=True, methods=["post"])
    def select_employees(self, request, pk=None):
        """
        Step 2 of the wizard. POST body: {"employee_ids": [1, 2, 3]}
        This is the ONLY way employee_ids gets set — enforces the brief's
        rule that a Payrun is only meaningfully "created" after this step.
        """
        payrun = self.get_object()
        employee_ids = request.data.get("employee_ids", [])

        if not employee_ids:
            return Response({"detail": "employee_ids cannot be empty."}, status=400)

        payrun.employee_ids = employee_ids
        payrun.save()

        # Create a draft Payslip per selected employee, skipping duplicates
        # (unique_together on the model also guards this at the DB level).
        for emp_id in employee_ids:
            Payslip.objects.get_or_create(payrun=payrun, employee_id=emp_id)

        return Response(PayrunSerializer(payrun).data)


class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated]