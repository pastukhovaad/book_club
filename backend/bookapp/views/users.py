"""
User management views.

Handles user profile, information retrieval, and user-related operations.
"""

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import CustomUser, UserStats, Book
from ..serializers import (
    UserInfoSerializer,
    SimpleAuthorSerializer,
    UserStatsSerializer,
    UpdateUserProfileSerializer,
    BookSerializer,
)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update the authenticated user's profile information."""
    user = request.user
    serializer = UpdateUserProfileSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_username(request):
    """Get the authenticated user's username."""
    user = request.user
    username = user.username
    return Response({"username": username})


@api_view(["GET"])
def get_userinfo(request, username):
    """Get public user information by username."""
    User = get_user_model()
    user = User.objects.get(username=username)
    serializer = UserInfoSerializer(user)
    return Response(serializer.data)


@api_view(["GET"])
def get_user_books(request, username):
    """
    Get books authored by a specific user.

    Returns all books if the requester is the author, otherwise only public books.
    """
    User = get_user_model()
    user = User.objects.get(username=username)

    # Optimize: select_related for author (which is 'user' here) and reading_group
    if request.user.is_authenticated and request.user == user:
        books = Book.objects.filter(author=user).select_related("author", "reading_group")
    else:
        books = Book.objects.filter(author=user, visibility="public").select_related(
            "author", "reading_group"
        )

    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_user(request, email):
    """Get user information by email address."""
    User = get_user_model()
    try:
        existing_user = User.objects.get(email=email)
        serializer = SimpleAuthorSerializer(existing_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_stats(request, username):
    """Get statistics for a specific user."""
    try:
        User = get_user_model()
        user = User.objects.get(username=username)

        stats, created = UserStats.objects.get_or_create(user=user)

        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
