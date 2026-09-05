from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, ContractViewSet, AttendanceViewSet, ScheduleViewSet

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"contracts", ContractViewSet, basename="contract")
router.register(r"attendance", AttendanceViewSet, basename="attendance")
router.register(r"schedules", ScheduleViewSet, basename="schedule")

urlpatterns = router.urls