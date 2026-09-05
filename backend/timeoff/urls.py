from rest_framework.routers import DefaultRouter
from .views import TimeOffTypeViewSet, AllocationViewSet, TimeOffRequestViewSet

router = DefaultRouter()
router.register("timeoff-types", TimeOffTypeViewSet)
router.register("allocations", AllocationViewSet)
router.register("timeoff-requests", TimeOffRequestViewSet)

urlpatterns = router.urls