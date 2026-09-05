from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', obtain_auth_token, name='api-token-auth'),
    path('api/', include('accounts.urls')),
    path('api/', include('timeoff.urls')),
    path('api/', include('audit.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('settlement.urls')),
    path('api/', include('dashboard.urls')),
]
