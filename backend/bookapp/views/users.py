from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Book, CustomUser, UserStats
from ..serializers import (
    BookSerializerInfo,
    SimpleAuthorSerializer,
    UpdateUserProfileSerializer,
    UserInfoSerializer,
    UserStatsSerializer,
)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    serializer = UpdateUserProfileSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_username(request):
    user = request.user
    return Response({"username": user.username, "is_superuser": user.is_superuser})


@api_view(["GET"])
def get_userinfo(request, username):
    User = get_user_model()
    user = get_object_or_404(User, username=username)
    serializer = UserInfoSerializer(user)
    return Response(serializer.data)


@api_view(["GET"])
def get_user_books(request, username):
    User = get_user_model()
    user = get_object_or_404(User, username=username)

    if request.user.is_authenticated and request.user == user:
        books = (
            Book.objects.filter(author=user)
            .select_related("author", "reading_group")
            .annotate(average_rating=Avg("bookreview__stars_amount"))
        )
    else:
        books = (
            Book.objects.filter(author=user, visibility="public")
            .select_related("author", "reading_group")
            .annotate(average_rating=Avg("bookreview__stars_amount"))
        )

    serializer = BookSerializerInfo(books, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_stats(request, username):
    try:
        User = get_user_model()
        user = User.objects.get(username=username)

        stats, created = UserStats.objects.get_or_create(user=user)

        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
