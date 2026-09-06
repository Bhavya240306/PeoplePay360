from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsHRPayrollUserOrAbove
from accounts.models import UserProfile
from .models import SalaryRule, SalaryStructure, Payrun, Payslip
from .serializers import SalaryRuleSerializer, SalaryStructureSerializer, PayrunSerializer, PayslipSerializer
from .services import (
    compute_payrun,
    render_payslip_pdf,
    send_payrun_payslips,
    send_payslip_email,
    generate_monthly_payruns,
)


class SalaryRuleViewSet(viewsets.ModelViewSet):
    queryset = SalaryRule.objects.all()
    serializer_class = SalaryRuleSerializer
    permission_classes = [IsHRPayrollUserOrAbove]

    def perform_create(self, serializer):
        category = serializer.validated_data["category"]
        serializer.save(sequence=SalaryRule.next_sequence_for_category(category))

    def perform_update(self, serializer):
        instance = serializer.instance
        new_category = serializer.validated_data.get("category", instance.category)
        if new_category != instance.category:
            serializer.save(sequence=SalaryRule.next_sequence_for_category(new_category, exclude_pk=instance.pk))
        else:
            serializer.save()


class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsHRPayrollUserOrAbove]


class PayrunViewSet(viewsets.ModelViewSet):
    queryset = Payrun.objects.all()
    serializer_class = PayrunSerializer
    permission_classes = [IsHRPayrollUserOrAbove]

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

    @action(detail=False, methods=["post"])
    def generate_monthly(self, request):
        """
        POST /api/payroll/payruns/generate_monthly/
        On-demand equivalent of the nightly scheduled job: generates and
        computes this month's payslips for every active employee (splitting
        out a separate, correctly-bounded payrun for anyone whose contract
        ends mid-month).
        """
        payruns = generate_monthly_payruns()
        return Response({"payruns": [p.id for p in payruns], "count": len(payruns)})


class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    permission_classes = [IsHRPayrollUserOrAbove]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "pdf", "send"):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        if profile and profile.role == UserProfile.ROLE_EMPLOYEE:
            qs = qs.filter(employee_id=profile.employee_id)
        return qs

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

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """
        POST /api/payroll/payslips/{id}/send/
        Emails just this one payslip. Employees can only reach their own
        payslip id here (get_object() is scoped by get_queryset() above),
        but sending is still restricted to HR Payroll roles.
        """
        profile = getattr(request.user, "profile", None)
        if not profile or profile.role < UserProfile.ROLE_HR_PAYROLL_USER:
            return Response({"detail": "Not permitted."}, status=403)
        payslip = self.get_object()
        sent = send_payslip_email(payslip)
        if not sent:
            return Response({"detail": "Payslip is not computed yet."}, status=400)
        return Response(PayslipSerializer(payslip).data)