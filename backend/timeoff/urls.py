from rest_framework.routers import DefaultRouter
from .views import TimeOffTypeViewSet, AllocationViewSet, TimeOffRequestViewSet

router = DefaultRouter()
router.register("timeoff-types", TimeOffTypeViewSet, basename="timeoff-types")
router.register("allocations", AllocationViewSet, basename="allocations")
router.register("timeoff-requests", TimeOffRequestViewSet, basename="timeoff-requests")
urlpatterns = router.urls
