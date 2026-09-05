from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleViewSet, DepartmentViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
router.register("roles", RoleViewSet, basename="roles")
router.register("departments", DepartmentViewSet, basename="departments")
urlpatterns = router.urls
