"""
Prize board management views.

Handles prize board operations, reward placement, and board settings.
"""

import logging
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import (
    PrizeBoard,
    PrizeBoardCell,
    UserReward,
    ReadingGroup,
    UserToReadingGroupState,
)
from ..serializers import PrizeBoardSerializer, PrizeBoardCellSerializer

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_prize_board(request, slug):
    """Get prize board for a reading group."""
    try:
        reading_group = ReadingGroup.objects.get(slug=slug)
        user = request.user

        # Check if user is a member (for can_edit flag)
        is_member = False
        try:
            membership = UserToReadingGroupState.objects.get(
                user=user, reading_group=reading_group
            )
            is_member = membership.in_reading_group
        except UserToReadingGroupState.DoesNotExist:
            is_member = False

        # Get or create prize board
        board, created = PrizeBoard.objects.get_or_create(reading_group=reading_group)

        serializer = PrizeBoardSerializer(board)
        response_data = serializer.data
        response_data["can_edit"] = is_member
        return Response(response_data)
    except ReadingGroup.DoesNotExist:
        return Response(
            {"error": "Reading group not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_prize_board_settings(request, slug):
    """Update prize board settings (size). Only group leader can do this."""
    try:
        reading_group = ReadingGroup.objects.get(slug=slug)
        user = request.user

        if reading_group.creator != user:
            return Response(
                {"error": "Only group leaders can update board settings"},
                status=status.HTTP_403_FORBIDDEN,
            )

        board, created = PrizeBoard.objects.get_or_create(reading_group=reading_group)

        width = request.data.get("width", board.width)
        height = request.data.get("height", board.height)

        board.width = width
        board.height = height
        board.save()

        serializer = PrizeBoardSerializer(board)
        return Response(serializer.data)
    except ReadingGroup.DoesNotExist:
        return Response(
            {"error": "Reading group not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_reward_on_board(request, slug):
    """Place a user's reward on the prize board."""
    try:
        reading_group = ReadingGroup.objects.get(slug=slug)
        user = request.user

        # Check if user is a member or the creator
        if reading_group.creator != user:
            try:
                membership = UserToReadingGroupState.objects.get(
                    user=user, reading_group=reading_group
                )
                if not membership.in_reading_group:
                    return Response(
                        {"error": "You must be a confirmed member to place rewards"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except UserToReadingGroupState.DoesNotExist:
                return Response(
                    {"error": "You must be a member to place rewards"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        board, created = PrizeBoard.objects.get_or_create(reading_group=reading_group)

        x = request.data.get("x")
        y = request.data.get("y")
        user_reward_id = request.data.get("user_reward")

        if x is None or y is None or user_reward_id is None:
            return Response(
                {"error": "x, y, and user_reward are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check coordinates are within board
        if x >= board.width or y >= board.height or x < 0 or y < 0:
            return Response(
                {"error": "Coordinates out of bounds"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if cell is already occupied
        if PrizeBoardCell.objects.filter(board=board, x=x, y=y).exists():
            return Response(
                {"error": "Cell is already occupied"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user owns the reward
        try:
            user_reward = UserReward.objects.get(id=user_reward_id, user=user)
        except UserReward.DoesNotExist:
            return Response(
                {"error": "Reward not found or does not belong to you"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create cell
        cell = PrizeBoardCell.objects.create(
            board=board, x=x, y=y, user_reward=user_reward, placed_by=user
        )

        serializer = PrizeBoardCellSerializer(cell)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except ReadingGroup.DoesNotExist:
        return Response(
            {"error": "Reading group not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_reward_from_board(request, slug, x, y):
    """Remove a reward from the prize board. Only the placer can remove it."""
    try:
        reading_group = ReadingGroup.objects.get(slug=slug)
        user = request.user

        board = PrizeBoard.objects.get(reading_group=reading_group)

        try:
            cell = PrizeBoardCell.objects.get(board=board, x=x, y=y)

            # Only the placer can remove their reward
            if cell.placed_by != user:
                return Response(
                    {"error": "You can only remove your own rewards"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            cell.delete()
            return Response(
                {"message": "Reward removed successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except PrizeBoardCell.DoesNotExist:
            return Response(
                {"error": "No reward at this position"},
                status=status.HTTP_404_NOT_FOUND,
            )
    except ReadingGroup.DoesNotExist:
        return Response(
            {"error": "Reading group not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except PrizeBoard.DoesNotExist:
        return Response(
            {"error": "Prize board not found"}, status=status.HTTP_404_NOT_FOUND
        )
