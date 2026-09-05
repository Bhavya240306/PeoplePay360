from rest_framework.routers import DefaultRouter
from .views import SettlementViewSet

router = DefaultRouter()
router.register("settlements", SettlementViewSet, basename="settlement")

urlpatterns = router.urls