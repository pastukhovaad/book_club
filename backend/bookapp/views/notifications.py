"""
Notification management views.

Handles notification CRUD operations for users.
"""

import logging
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Notification, ReadingGroup, CustomUser
from ..serializers import NotificationSerializer
from .utils import AnyListPagination

logger = logging.getLogger(__name__)


@api_view(["GET"])
def get_notification(request, id):
    notification = get_object_or_404(Notification, id=id)
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)


@api_view(["GET"])
def notification_list(request, amount):
    user = request.user
    # Optimize: select_related for foreign keys accessed by NotificationSerializer
    notifications = Notification.objects.filter(directed_to=user).select_related(
        'directed_to', 'related_to', 'related_group', 'related_quest', 'related_reward'
    )
    paginator = AnyListPagination(amount=amount)
    paginated_notifications = paginator.paginate_queryset(notifications, request)
    serializer = NotificationSerializer(paginated_notifications, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_notification(request):
    user = request.user
    directed_to_id = request.data.get("directed_to_id")
    if directed_to_id:
        directed_user = get_object_or_404(CustomUser, id=directed_to_id)
    else:
        directed_user = None
    related_group_id = request.data.get("related_group_id")
    if related_group_id:
        related_group = get_object_or_404(ReadingGroup, id=related_group_id)
    serializer = NotificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            related_to=user,
            directed_to=directed_user,
            related_group=related_group,
            extra_text="",
        )
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    notification = get_object_or_404(Notification, id=pk)
    user = request.user
    if notification.directed_to != user:
        logger.info(f"Correct user: {notification.directed_to}; Recieved user: {user}")
        return Response(
            {
                "error": f"Вы не являетесь получателем этого уведомления; {notification.directed_to}"
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # figure out why the above check does not work properly
    notification.delete()
    return Response(
        {"message": "Сообщение успешно удалено"}, status=status.HTTP_204_NO_CONTENT
    )
