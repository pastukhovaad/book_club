"""
Quest management views.

Handles quest creation, daily quest generation, and progress tracking.
"""

import logging
import random

from django.db import models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import (
    CustomUser,
    Quest,
    QuestCompletion,
    QuestProgress,
    ReadingGroup,
    RewardTemplate,
    UserToReadingGroupState,
)
from ..serializers import (
    QuestCompletionSerializer,
    QuestProgressSerializer,
    QuestSerializer,
)

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_quests(request):
    """Get all active global quests and user's group quests."""
    user = request.user
    from django.utils import timezone

    # Get user's groups
    user_groups = UserToReadingGroupState.objects.filter(
        user=user, in_reading_group=True
    ).values_list("reading_group_id", flat=True)

    # Get active quests
    quests = (
        Quest.objects.filter(
            is_active=True, start_date__lte=timezone.now(), end_date__gte=timezone.now()
        )
        .filter(
            models.Q(reading_group_id__in=user_groups)
            | models.Q(
                reading_group__isnull=True,
                participation_type="personal",
                created_by=user,
            )
            | models.Q(
                reading_group__isnull=True,
                participation_type="group",
            )
        )
        .select_related("created_by", "reward_template", "reading_group")
    )

    serializer = QuestSerializer(quests, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_group_quests(request, slug):
    """Get quests for a specific group with user's progress."""
    try:
        from django.utils import timezone

        reading_group = get_object_or_404(ReadingGroup, slug=slug)
        user = request.user

        # Check if user is a member
        try:
            membership = UserToReadingGroupState.objects.get(
                user=user, reading_group=reading_group
            )
            if not membership.in_reading_group:
                return Response(
                    {"error": "You must be a confirmed member to view group quests"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except UserToReadingGroupState.DoesNotExist:
            return Response(
                {"error": "You must be a member to view group quests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        quests = Quest.objects.filter(
            reading_group=reading_group,
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now(),
        ).select_related("created_by", "reward_template")

        # Get progress for each quest
        result = []
        for quest in quests:
            if quest.participation_type == "group":
                total_count = (
                    QuestProgress.objects.filter(quest=quest)
                    .aggregate(total=models.Sum("current_count"))
                    .get("total")
                    or 0
                )
                user_progress = QuestProgress.objects.filter(
                    quest=quest, user=user
                ).first()
                participated = bool(user_progress and user_progress.current_count > 0)
                reward_received = QuestCompletion.objects.filter(
                    quest=quest, user=user
                ).exists()
                progress_percentage = (
                    min(100, (total_count / quest.target_count) * 100)
                    if quest.target_count > 0
                    else 0
                )
                progress_data = {
                    "current_count": total_count,
                    "progress_percentage": progress_percentage,
                    "participated": participated,
                    "reward_received": reward_received,
                }
            else:
                progress, created = QuestProgress.objects.get_or_create(
                    user=user, quest=quest, defaults={"current_count": 0}
                )
                progress_data = QuestProgressSerializer(progress).data
            result.append(
                {
                    "quest": QuestSerializer(quest).data,
                    "progress": progress_data,
                }
            )

        return Response(result)
    except ReadingGroup.DoesNotExist:
        return Response(
            {"error": "Reading group not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_daily_quests(request, slug):
    """Generate 3 random daily quests for a reading group."""
    try:
        reading_group = ReadingGroup.objects.get(slug=slug)
        user = request.user

        # Check if user is a member
        try:
            membership = UserToReadingGroupState.objects.get(
                user=user, reading_group=reading_group
            )
            if not membership.in_reading_group:
                return Response(
                    {"error": "You must be a confirmed member to generate quests"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except UserToReadingGroupState.DoesNotExist:
            return Response(
                {"error": "You must be a member to generate quests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if there are already active quests for today
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = timezone.now().replace(
            hour=23, minute=59, second=59, microsecond=999999
        )

        existing_quests = Quest.objects.filter(
            reading_group=reading_group,
            is_active=True,
            start_date__gte=today_start,
            end_date__lte=today_end,
        )

        if existing_quests.exists():
            # Return existing quests
            serializer = QuestSerializer(existing_quests, many=True)
            return Response(
                {
                    "message": "Сегодняшние задания уже созданы",
                    "quests": serializer.data,
                }
            )

        # Quest templates
        import random

        quest_templates = [
            {
                "title": "Читательский марафон",
                "description": "Прочитайте книгу сегодня",
                "quest_type": "read_books",
                "target_count": 1,
            },
            {
                "title": "Активный читатель",
                "description": "Оставьте комментарии к книгам",
                "quest_type": "create_comments",
                "target_count": 3,
            },
            {
                "title": "Обсуждение",
                "description": "Ответьте на комментарии других читателей",
                "quest_type": "reply_comments",
                "target_count": 2,
            },
            {
                "title": "Щедрость",
                "description": "Разместите призы на доске",
                "quest_type": "place_rewards",
                "target_count": 1,
            },
            {
                "title": "Книжный червь",
                "description": "Прочитайте несколько книг",
                "quest_type": "read_books",
                "target_count": 2,
            },
            {
                "title": "Комментатор",
                "description": "Оставьте много комментариев",
                "quest_type": "create_comments",
                "target_count": 5,
            },
        ]

        # Select 3 random quests
        selected_templates = random.sample(quest_templates, 3)

        # Get all available reward templates
        available_rewards = list(RewardTemplate.objects.all())

        # Create quests
        created_quests = []
        for template in selected_templates:
            # Assign a random reward if available
            reward_template = (
                random.choice(available_rewards) if available_rewards else None
            )

            quest = Quest.objects.create(
                title=template["title"],
                description=template["description"],
                quest_type=template["quest_type"],
                target_count=template["target_count"],
                participation_type="group",
                period="day",
                reading_group=reading_group,
                created_by=user,
                reward_template=reward_template,
                start_date=today_start,
                end_date=today_end,
                is_active=True,
            )
            created_quests.append(quest)

        serializer = QuestSerializer(created_quests, many=True)
        return Response(
            {
                "message": "Сегодняшние задания успешно созданы",
                "quests": serializer.data,
            }
        )

    except ReadingGroup.DoesNotExist:
        return Response(
            {"error": "Группа для чтения не найдена"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_daily_personal_quests(request):
    """Generate 3 random daily personal quests (global personal)."""
    from django.utils import timezone

    user = request.user

    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = timezone.now().replace(
        hour=23, minute=59, second=59, microsecond=999999
    )

    existing_quests = Quest.objects.filter(
        reading_group__isnull=True,
        participation_type="personal",
        period="day",
        created_by=user,
        is_active=True,
        start_date__gte=today_start,
        end_date__lte=today_end,
    )

    if existing_quests.exists():
        for quest in existing_quests:
            QuestProgress.objects.get_or_create(
                user=user, quest=quest, defaults={"current_count": 0}
            )
        serializer = QuestSerializer(existing_quests, many=True)
        return Response(
            {
                "message": "Сегодняшние личные задания уже созданы",
                "quests": serializer.data,
            }
        )

    quest_templates = [
        {
            "title": "Читательский марафон",
            "description": "Прочитайте книгу сегодня",
            "quest_type": "read_books",
            "target_count": 1,
        },
        {
            "title": "Активный читатель",
            "description": "Оставьте комментарии к книгам",
            "quest_type": "create_comments",
            "target_count": 3,
        },
        {
            "title": "Обсуждение",
            "description": "Ответьте на комментарии других читателей",
            "quest_type": "reply_comments",
            "target_count": 2,
        },
        {
            "title": "Щедрость",
            "description": "Разместите призы на доске",
            "quest_type": "place_rewards",
            "target_count": 1,
        },
        {
            "title": "Книжный червь",
            "description": "Прочитайте несколько книг",
            "quest_type": "read_books",
            "target_count": 2,
        },
        {
            "title": "Комментатор",
            "description": "Оставьте много комментариев",
            "quest_type": "create_comments",
            "target_count": 5,
        },
    ]

    import random

    selected_templates = random.sample(quest_templates, 3)
    available_rewards = list(RewardTemplate.objects.all())

    created_quests = []
    for template in selected_templates:
        reward_template = (
            random.choice(available_rewards) if available_rewards else None
        )

        quest = Quest.objects.create(
            title=template["title"],
            description=template["description"],
            quest_type=template["quest_type"],
            target_count=template["target_count"],
            participation_type="personal",
            period="day",
            reading_group=None,
            created_by=user,
            reward_template=reward_template,
            start_date=today_start,
            end_date=today_end,
            is_active=True,
        )
        QuestProgress.objects.get_or_create(
            user=user, quest=quest, defaults={"current_count": 0}
        )
        created_quests.append(quest)

    serializer = QuestSerializer(created_quests, many=True)
    return Response(
        {
            "message": "Сегодняшние личные задания успешно созданы",
            "quests": serializer.data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_quest(request):
    """Create a quest (admin for global, group leader for group)."""
    user = request.user
    reading_group_id = request.data.get("reading_group")

    # Check permissions
    if reading_group_id:
        try:
            reading_group = ReadingGroup.objects.get(id=reading_group_id)
            if reading_group.creator != user:
                return Response(
                    {"error": "Only group leaders can create group quests"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except ReadingGroup.DoesNotExist:
            return Response(
                {"error": "Reading group not found"}, status=status.HTTP_404_NOT_FOUND
            )
    elif not user.is_staff:
        return Response(
            {"error": "Only admins can create global quests"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = QuestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_quest_progress(request, quest_id):
    """Get current user's progress on a specific quest."""
    user = request.user

    try:
        quest = Quest.objects.get(id=quest_id)

        try:
            progress = QuestProgress.objects.get(quest=quest, user=user)
            serializer = QuestProgressSerializer(progress)
            return Response(serializer.data)
        except QuestProgress.DoesNotExist:
            # Return zero progress if not started
            return Response(
                {
                    "quest": quest_id,
                    "user": user.id,
                    "current_count": 0,
                    "progress_percentage": 0,
                }
            )
    except Quest.DoesNotExist:
        return Response({"error": "Quest not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_quests(request):
    """Get all quests user is participating in with progress."""
    user = request.user
    from django.utils import timezone

    now = timezone.now()

    personal_quests = Quest.objects.filter(
        participation_type="personal",
        reading_group__isnull=True,
        created_by=user,
        is_active=True,
        start_date__lte=now,
        end_date__gte=now,
    )

    for quest in personal_quests:
        QuestProgress.objects.get_or_create(
            user=user, quest=quest, defaults={"current_count": 0}
        )

    user_groups = UserToReadingGroupState.objects.filter(
        user=user, in_reading_group=True
    ).values_list("reading_group_id", flat=True)

    quests = (
        Quest.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )
        .filter(
            models.Q(reading_group_id__in=user_groups)
            | models.Q(
                participation_type="personal",
                reading_group__isnull=True,
                created_by=user,
            )
        )
        .select_related("created_by", "reward_template", "reading_group")
    )

    progress_map = {
        p.quest_id: p for p in QuestProgress.objects.filter(user=user, quest__in=quests)
    }

    result = []
    for quest in quests:
        if quest.participation_type == "group":
            total_count = (
                QuestProgress.objects.filter(quest=quest)
                .aggregate(total=models.Sum("current_count"))
                .get("total")
                or 0
            )
            user_progress = progress_map.get(quest.id)
            participated = bool(user_progress and user_progress.current_count > 0)
            reward_received = QuestCompletion.objects.filter(
                quest=quest, user=user
            ).exists()
            progress_percentage = (
                min(100, (total_count / quest.target_count) * 100)
                if quest.target_count > 0
                else 0
            )
            progress_data = {
                "current_count": total_count,
                "progress_percentage": progress_percentage,
                "participated": participated,
                "reward_received": reward_received,
            }
        else:
            progress = progress_map.get(quest.id)
            current_count = progress.current_count if progress else 0
            progress_percentage = (
                min(100, (current_count / quest.target_count) * 100)
                if quest.target_count > 0
                else 0
            )
            progress_data = {
                "current_count": current_count,
                "progress_percentage": progress_percentage,
            }

        result.append(
            {
                "quest": QuestSerializer(quest).data,
                "progress": progress_data,
            }
        )

    return Response(result)
