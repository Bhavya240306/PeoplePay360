from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services import build_dashboard


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payroll_dashboard(request):
    period = request.query_params.get("period")
    department_id = request.query_params.get("department")
    employee_type = request.query_params.get("employee_type")
    return Response(build_dashboard(period=period, department_id=department_id, employee_type=employee_type))
