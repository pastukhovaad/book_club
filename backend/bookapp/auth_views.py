"""
Authentication views with rate limiting.
"""
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import UserRegistrationSerializer


# Rate limit: 5 attempts per minute per IP address
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='dispatch')
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    Token obtain view with rate limiting to prevent brute force attacks.
    Limits to 5 login attempts per minute per IP address.
    """
    pass


# Rate limit: 10 token refreshes per minute per IP address (more lenient)
@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='dispatch')
class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    Token refresh view with rate limiting.
    Limits to 10 refresh attempts per minute per IP address.
    """
    pass


# Rate limit: 3 registrations per hour per IP address
@api_view(["POST"])
@ratelimit(key='ip', rate='3/h', method='POST', block=True)
def register_user(request):
    """
    User registration endpoint with rate limiting.
    Limits to 3 registration attempts per hour per IP address to prevent spam.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
