import logging

from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Book, ReadingGroup
from .serializers import (
    BookSerializer,
    ReadingGroupSerializer,
    SimpleAuthorSerializer,
    UpdateUserProfileSerializer,
    UserInfoSerializer,
    UserRegistrationSerializer,
)

# logger = logging.getLogger(__name__)
# logging.basicConfig(
#     filename="/home/sasha/book_club/backend/bookapp/myapp.log", level=logging.INFO
# )


class AnyListPagination(PageNumberPagination):
    def __init__(self, amount):
        self.page_size = amount


# Create your views here.
@api_view(["GET"])
def book_list(request, amount):
    books = Book.objects.all()
    paginator = AnyListPagination(amount=amount)
    paginated_books = paginator.paginate_queryset(books, request)
    serializer = BookSerializer(paginated_books, many=True)
    # logger.info(f"requested URL: {request.build_absolute_uri()}")
    # logger.info(f"Pagination info: {paginator.page_size} items per page requested.")
    # logger.info(f"Pagination info: {paginator.page.number} current page number.")
    # logger.info(f"Books retrieved: {serializer.data}")
    return paginator.get_paginated_response(serializer.data)


# @api_view(['GET'])
# def book_list(request):
#     books = Book.objects.all()
#     serializer = BookSerializer(books, many=True)
#     return Response(serializer.data)


@api_view(["GET"])
def get_book(request, slug):
    book = Book.objects.get(slug=slug)
    serializer = BookSerializer(book)
    return Response(serializer.data)


@api_view(["GET"])  # REM
def get_reading_group(request, slug):
    reading_group = ReadingGroup.objects.get(slug=slug)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


# @api_view(["GET"])
# def reading_group_list(request):
#     reading_groups = ReadingGroup.objects.all()
#     paginator = ReadingGroupListPagination()
#     paginated_reading_groups = paginator.paginate_queryset(reading_groups, request)
#     serializer = ReadingGroupSerializer(paginated_reading_groups, many=True)
#     # logger.info(f"requested URL: {request.build_absolute_uri()}")
#     # logger.info(f"Pagination info: {paginator.page_size} items per page requested.")
#     # logger.info(f"Pagination info: {paginator.page.number} current page number.")
#     # logger.info(f"Reading groups retrieved: {serializer.data}")
#     return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
def reading_group_list(request, amount):
    reading_groups = ReadingGroup.objects.all()
    paginator = AnyListPagination(amount=amount)
    paginated_reading_groups = paginator.paginate_queryset(reading_groups, request)
    serializer = ReadingGroupSerializer(paginated_reading_groups, many=True)
    # logger.info(f"requested URL: {request.build_absolute_uri()}")
    # logger.info(f"Pagination info: {paginator.page_size} items per page requested.")
    # logger.info(f"Pagination info: {paginator.page.number} current page number.")
    # logger.info(f"Reading groups retrieved: {serializer.data}")
    return paginator.get_paginated_response(serializer.data)


@api_view(["POST"])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    serializer = UpdateUserProfileSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_book(request):
    user = request.user
    serializer = BookSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=user)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reading_group(request):
    user = request.user
    serializer = ReadingGroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=user)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_book(request, pk):
    user = request.user
    book = Book.objects.get(id=pk)
    if book.author != user:
        return Response(
            {"error": "You are not the author of this book"},
            status=status.HTTP_403_FORBIDDEN,
        )
    serializer = BookSerializer(book, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_reading_group(request, pk):
    user = request.user
    reading_group = ReadingGroup.objects.get(id=pk)
    if reading_group.creator != user:
        return Response(
            {"error": "You are not the creator of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    serializer = ReadingGroupSerializer(reading_group, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def add_user_to_group(request, pk):
    user = request.user
    reading_group = ReadingGroup.objects.get(id=pk)
    reading_group.user.add(user)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def remove_user_from_group(request, pk):
    user = request.user
    reading_group = ReadingGroup.objects.get(id=pk)
    reading_group.user.remove(user)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


# @api_view(["PUT"])
# def update_book(request, pk):
#     book = Book.objects.get(id=pk)
#     serializer = BookSerializer(book, data=request.data)
#     if serializer.is_valid():
#         serializer.save()
#         return Response(serializer.data)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_book(request, pk):
    book = Book.objects.get(id=pk)
    user = request.user
    if book.author != user:
        return Response(
            {"error": "You are not the author of this book"},
            status=status.HTTP_403_FORBIDDEN,
        )
    book.delete()
    return Response(
        {"message": "Book deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_reading_group(request, pk):
    reading_group = ReadingGroup.objects.get(id=pk)
    user = request.user
    if reading_group.creator != user:
        return Response(
            {"error": "You are not the creator of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    reading_group.delete()
    return Response(
        {"message": "Group deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_username(request):
    user = request.user
    username = user.username
    return Response({"username": username})


@api_view(["GET"])
def get_userinfo(request, username):
    User = get_user_model()
    user = User.objects.get(username=username)
    serializer = UserInfoSerializer(user)
    return Response(serializer.data)


@api_view(["GET"])
def get_user(request, email):
    User = get_user_model()
    try:
        existing_user = User.objects.get(email=email)
        serializer = SimpleAuthorSerializer(existing_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


# Facebook: https://www.facebook.com/sampleusername
# Instagram: https://www.instagram.com/sampleusername
# YouTube: https://www.youtube.com/user/sampleusername
# Twitter (now X): https://twitter.com/sampleusername
