import logging

from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import (
    Book,
    BookComment,
    CustomUser,
    Notification,
    ReadingGroup,
    UserToReadingGroupState,
)
from ..serializers import (
    BookSerializerInfo,
    ReadingGroupSerializer,
    UserToReadingGroupStateSerializer,
)
from .utils import AnyListPagination

logger = logging.getLogger(__name__)


@api_view(["GET"])
def get_reading_group(request, slug):
    reading_group = get_object_or_404(
        ReadingGroup.objects.select_related("creator").prefetch_related(
            "user", "user__usertoreadinggroupstate_set"
        ),
        slug=slug,
    )
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_group_reading_books(request, slug):
    reading_group = get_object_or_404(ReadingGroup, slug=slug)
    user = request.user

    is_member = UserToReadingGroupState.objects.filter(
        user=user, reading_group=reading_group, in_reading_group=True
    ).exists()
    if not is_member and reading_group.creator != user:
        return Response(
            {"error": "You must be a member to view group books"},
            status=status.HTTP_403_FORBIDDEN,
        )

    book_ids = (
        BookComment.objects.filter(reading_group=reading_group)
        .values_list("book_id", flat=True)
        .distinct()
    )
    books = (
        Book.objects.filter(id__in=book_ids)
        .select_related("author", "reading_group")
        .annotate(average_rating=Avg("bookreview__stars_amount"))
    )
    serializer = BookSerializerInfo(books, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_group_posted_books(request, slug):
    reading_group = get_object_or_404(ReadingGroup, slug=slug)
    user = request.user

    is_member = UserToReadingGroupState.objects.filter(
        user=user, reading_group=reading_group, in_reading_group=True
    ).exists()
    if not is_member and reading_group.creator != user:
        return Response(
            {"error": "You must be a member to view group books"},
            status=status.HTTP_403_FORBIDDEN,
        )

    books = Book.objects.filter(
        visibility="group",
        reading_group=reading_group,
        author=reading_group.creator,
    ).annotate(average_rating=Avg("bookreview__stars_amount"))
    serializer = BookSerializerInfo(books, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def reading_group_list(request, amount=None):
    if amount is None:
        amount = request.query_params.get("amount", 9)
    try:
        amount = int(amount)
    except (TypeError, ValueError):
        return Response(
            {"error": "Invalid amount"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    reading_groups = (
        ReadingGroup.objects.select_related("creator")
        .prefetch_related(
            "user",
            "user__usertoreadinggroupstate_set",
        )
        .all()
    )
    paginator = AnyListPagination(amount=amount)
    paginated_reading_groups = paginator.paginate_queryset(reading_groups, request)
    serializer = ReadingGroupSerializer(paginated_reading_groups, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_to_reading_group_state_list(request, pk):

    user = request.user
    user_to_reading_group_states = UserToReadingGroupState.objects.filter(
        reading_group_id=pk, user=user
    )

    serializer = UserToReadingGroupStateSerializer(
        user_to_reading_group_states, many=True
    )
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_reading_groups(request):
    user = request.user

    group_ids = UserToReadingGroupState.objects.filter(
        user=user, in_reading_group=True
    ).values_list("reading_group_id", flat=True)

    reading_groups = (
        ReadingGroup.objects.filter(id__in=group_ids)
        .select_related("creator")
        .prefetch_related("user", "user__usertoreadinggroupstate_set")
    )

    serializer = ReadingGroupSerializer(reading_groups, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_created_groups(request):
    user = request.user
    reading_groups = (
        ReadingGroup.objects.filter(creator=user)
        .select_related("creator")
        .prefetch_related("user", "user__usertoreadinggroupstate_set")
    )
    serializer = ReadingGroupSerializer(reading_groups, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reading_group(request):
    user = request.user
    serializer = ReadingGroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=user)

        reading_group = serializer.instance
        UserToReadingGroupState.objects.create(
            user=user, reading_group=reading_group, in_reading_group=True
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_reading_group(request, pk):
    user = request.user
    reading_group = get_object_or_404(ReadingGroup, id=pk)
    if reading_group.creator != user:
        return Response(
            {"error": "You are not the creator of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )

    old_featured_image = (
        reading_group.featured_image
        if "featured_image" in request.FILES and reading_group.featured_image
        else None
    )

    serializer = ReadingGroupSerializer(reading_group, data=request.data)
    if serializer.is_valid():
        serializer.save()

        if old_featured_image:
            old_featured_image.delete(save=False)

        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def add_user_to_group(request, pk):
    user = request.user
    reading_group = get_object_or_404(ReadingGroup, id=pk)
    reading_group.user.add(user, through_defaults={"in_reading_group": False})

    creator = reading_group.creator
    if creator and creator != user:
        Notification.objects.create(
            directed_to=creator,
            related_to=user,
            related_group=reading_group,
            category="GroupJoinRequest",
            extra_text="",
        )
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def confirm_user_to_group(request, pk, user_id):
    reading_group = get_object_or_404(ReadingGroup, id=pk)
    user = get_object_or_404(CustomUser, id=user_id)
    if reading_group.creator != request.user:
        return Response(
            {"error": "Only the group creator can confirm members"},
            status=status.HTTP_403_FORBIDDEN,
        )

    UserToReadingGroupState.objects.filter(
        reading_group=reading_group, user=user
    ).update(in_reading_group=True)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def remove_user_from_group(request, pk):
    user = request.user
    reading_group = get_object_or_404(ReadingGroup, id=pk)
    reading_group.user.remove(user)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def kick_user_from_group(request, pk, user_id):
    reading_group = get_object_or_404(ReadingGroup, id=pk)

    if reading_group.creator != request.user:
        return Response(
            {"error": "Only the group creator can remove members"},
            status=status.HTTP_403_FORBIDDEN,
        )

    from django.contrib.auth import get_user_model

    User = get_user_model()
    user_to_remove = get_object_or_404(User, id=user_id)

    if user_to_remove not in reading_group.user.all():
        return Response(
            {"error": "User is not a member of this group"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user_to_remove == request.user:
        return Response(
            {"error": "You cannot remove yourself from your own group"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reading_group.user.remove(user_to_remove)

    UserToReadingGroupState.objects.filter(
        reading_group=reading_group, user=user_to_remove
    ).delete()

    Notification.objects.create(
        directed_to=user_to_remove,
        related_to=request.user,
        related_group=reading_group,
        category="GroupKick",
        extra_text="",
    )

    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_reading_group(request, pk):
    reading_group = get_object_or_404(ReadingGroup, id=pk)
    user = request.user
    if reading_group.creator != user:
        return Response(
            {"error": "You are not the creator of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if reading_group.featured_image:
        reading_group.featured_image.delete(save=False)

    reading_group.delete()
    return Response(
        {"message": "Group deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )
