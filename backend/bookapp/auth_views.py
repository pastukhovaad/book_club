from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import UserRegistrationSerializer


@method_decorator(
    ratelimit(key="ip", rate="5/m", method="POST", block=True), name="dispatch"
)
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    pass


@method_decorator(
    ratelimit(key="ip", rate="10/m", method="POST", block=True), name="dispatch"
)
class RateLimitedTokenRefreshView(TokenRefreshView):
    pass


@api_view(["POST"])
@ratelimit(key="ip", rate="30/h", method="POST", block=True)  # TODO: change to 3/h
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
