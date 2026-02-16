from bookapp.auth_views import (
    RateLimitedTokenObtainPairView,
    RateLimitedTokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("bookapp.urls")),
    path("token/", RateLimitedTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token_refresh/", RateLimitedTokenRefreshView.as_view(), name="token_refresh"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
