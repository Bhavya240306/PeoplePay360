from rest_framework.routers import DefaultRouter
from .views import SalaryRuleViewSet, SalaryStructureViewSet, PayrunViewSet, PayslipViewSet

router = DefaultRouter()
router.register("salary-rules", SalaryRuleViewSet)
router.register("salary-structures", SalaryStructureViewSet)
router.register("payruns", PayrunViewSet)
router.register("payslips", PayslipViewSet)

urlpatterns = router.urls