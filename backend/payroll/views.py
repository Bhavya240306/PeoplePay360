from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SalaryRule, SalaryStructure, Payrun, Payslip
from .serializers import SalaryRuleSerializer, SalaryStructureSerializer, PayrunSerializer, PayslipSerializer
from .services import compute_payrun, render_payslip_pdf, send_payrun_payslips


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

        for emp_id in employee_ids:
            Payslip.objects.get_or_create(payrun=payrun, employee_id=emp_id)

        return Response(PayrunSerializer(payrun).data)

    @action(detail=True, methods=["post"])
    def compute(self, request, pk=None):
        """
        Runs the payroll engine for every selected employee in this Payrun,
        saving real PayslipLine rows and flipping status to 'computed'.
        """
        payrun = self.get_object()
        compute_payrun(payrun)
        return Response(PayrunSerializer(payrun).data)

    @action(detail=True, methods=["post"])
    def send_payslips(self, request, pk=None):
        """
        POST /api/payroll/payruns/{id}/send_payslips/
        Emails every computed payslip in this payrun as a PDF attachment.
        """
        payrun = self.get_object()
        sent_count = send_payrun_payslips(payrun)
        return Response({"sent": sent_count})


class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """
        GET /api/payroll/payslips/{id}/pdf/
        Returns a downloadable PDF of this single payslip.
        """
        payslip = self.get_object()
        pdf_bytes = render_payslip_pdf(payslip)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="payslip_{payslip.id}.pdf"'
        return response