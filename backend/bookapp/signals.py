"""
Signals for automatic quest progress tracking.

This module handles automatic updates to quest progress when users perform
actions like creating comments, completing books, or placing rewards.
"""

from django.db.models import Sum
from django.db.models.signals import post_delete, post_save, pre_save
from django.db import transaction
from django.dispatch import receiver
from django.utils import timezone

from .models import (
    BookComment,
    Notification,
    PrizeBoardCell,
    Quest,
    QuestCompletion,
    QuestProgress,
    ReadingProgress,
    UserReward,
    UserRewardSummary,
    UserStats,
)
# from backend.bookapp import models


def update_reward_summary(user, reward_template):
    """Recalculate reward summary for a user and reward template."""
    total_count = UserReward.objects.filter(
        user=user,
        reward_template=reward_template,
    ).count()

    summary, _ = UserRewardSummary.objects.get_or_create(
        user=user,
        reward_template=reward_template,
    )

    summary.total_count = total_count
    latest_reward = (
        UserReward.objects.filter(
            user=user,
            reward_template=reward_template,
        )
        .order_by("-received_at")
        .first()
    )
    summary.last_received_at = latest_reward.received_at if latest_reward else None
    summary.save()


def update_quest_progress(user, quest_type, reading_group=None):
    """
    Update progress for all active quests of a specific type for a user.

    Args:
        user: The user performing the action
        quest_type: Type of quest ('read_books', 'create_comments', 'reply_comments', 'place_rewards')
        reading_group: Optional reading group for group quests
    """
    now = timezone.now()

    # Find all active quests of this type
    quests = Quest.objects.filter(
        quest_type=quest_type,
        is_active=True,
        is_completed=False,  # Only update quests that are not completed
        start_date__lte=now,
        end_date__gte=now,
    )

    # Filter for personal vs group quests
    for quest in quests:
        # Skip if quest is for a group and user is not in that group
        if quest.reading_group and quest.reading_group != reading_group:
            continue

        # Skip if quest is global and we have a group context (for group-specific actions)
        if quest.participation_type == "group" and not reading_group:
            continue

        # Get or create progress
        progress, created = QuestProgress.objects.get_or_create(
            quest=quest, user=user, defaults={"current_count": 0}
        )

        # Increment progress
        progress.current_count += 1
        progress.save()

        # В случае группового квеста нужно посчитать суммарный прогресс всех участников
        if quest.participation_type == "group" and reading_group:
            total_group_count = QuestProgress.objects.filter(
                quest=quest,
                user__usertoreadinggroupstate__reading_group=reading_group,
                user__usertoreadinggroupstate__in_reading_group=True,
            ).aggregate(total_count=Sum("current_count"))["total_count"] or 0

            progress.current_count = total_group_count
        # save не делаем здесь, чтобы не перезаписывать индивидуальный прогресс
        # в блоке выше пересчитывается прогресс для группового квеста


        # Check if quest is completed (reached target)

            if progress.current_count >= quest.target_count and not quest.is_completed:

            # Mark quest as completed to prevent further progress updates        
                with transaction.atomic():
                    quest_check = Quest.objects.select_for_update().get(id=quest.id)
                    if not quest_check.is_completed:
                        quest_check.is_completed = True
                        quest_check.save()

                        # Get all users who contributed to this quest (have progress > 0)
                        contributing_progresses = QuestProgress.objects.filter(
                            quest=quest, current_count__gt=0
                        ).select_related("user")

                        # Award rewards and create notifications for ALL contributors
                        for contributor_progress in contributing_progresses:
                            contributor = contributor_progress.user

                            # Create completion record if it doesn't exist
                            completion, completion_created = QuestCompletion.objects.get_or_create(
                                quest=quest,
                                user=contributor,
                                defaults={
                                    "reading_group": (
                                        reading_group
                                        if quest.participation_type == "group"
                                        else None
                                    )
                                },
                            )

                            # Award the reward if one is configured and not already awarded
                            if quest.reward_template:
                                # Check if reward was already given to this user for this quest
                                if not UserReward.objects.filter(
                                    user=contributor,
                                    reward_template=quest.reward_template,
                                    quest_completed=completion,
                                ).exists():
                                    UserReward.objects.create(
                                        user=contributor,
                                        reward_template=quest.reward_template,
                                        quest_completed=completion,
                                    )

                                    # Update user stats
                                    stats, _ = UserStats.objects.get_or_create(user=contributor)
                                    stats.total_rewards_received += 1
                                    stats.save()

                            # Update quest completion stats (only if completion was just created)
                            if completion_created:
                                stats, _ = UserStats.objects.get_or_create(user=contributor)
                                stats.total_quests_completed += 1
                                stats.save()

                            # Create notification for quest completion (without using extra_text)
                            Notification.objects.create(
                                directed_to=contributor,
                                related_to=contributor,
                                related_group=reading_group,
                                related_quest=quest,
                                related_reward=quest.reward_template,
                                category="QuestCompleted",
                            )


@receiver(post_save, sender=BookComment)
def track_comment_quests(sender, instance, created, **kwargs):
    """
    Track quest progress when a comment or reply is created.
    """
    if not created:
        return

    # Check if it's a reply or a root comment
    if instance.parent_comment:
        # It's a reply
        quest_type = "reply_comments"
        stats, _ = UserStats.objects.get_or_create(user=instance.user)
        stats.total_replies_created += 1
        stats.save()
    else:
        # It's a root comment
        quest_type = "create_comments"

        # Update user stats for comments
        stats, _ = UserStats.objects.get_or_create(user=instance.user)
        stats.total_comments_created += 1
        stats.save()

    # Update quest progress
    update_quest_progress(
        user=instance.user, quest_type=quest_type, reading_group=instance.reading_group
    )


@receiver(pre_save, sender=ReadingProgress)
def store_previous_completion_state(sender, instance, **kwargs):
    """
    Store the previous completion state before saving.
    """
    if instance.pk:
        try:
            old_instance = ReadingProgress.objects.get(pk=instance.pk)
            instance._was_completed = old_instance.is_completed
        except ReadingProgress.DoesNotExist:
            instance._was_completed = False
    else:
        instance._was_completed = False


@receiver(post_save, sender=ReadingProgress)
def track_reading_quests(sender, instance, created, **kwargs):
    """
    Track quest progress when a book is completed.
    Only triggers when is_completed changes from False to True.
    """
    # Check if book was just marked as completed (transition from False to True)
    was_completed = getattr(instance, "_was_completed", False)

    if instance.is_completed and not was_completed:
        # Update user stats
        stats, _ = UserStats.objects.get_or_create(user=instance.user)
        stats.total_books_read += 1
        stats.save()

        # Update quest progress for all relevant reading groups
        # (user might be reading the same book in multiple groups)
        from .models import UserToReadingGroupState

        user_groups = UserToReadingGroupState.objects.filter(
            user=instance.user, in_reading_group=True
        )

        # Update for global quests (no group)
        update_quest_progress(
            user=instance.user, quest_type="read_books", reading_group=None
        )

        # Update for each group the user is in
        for membership in user_groups:
            update_quest_progress(
                user=instance.user,
                quest_type="read_books",
                reading_group=membership.reading_group,
            )


@receiver(post_save, sender=PrizeBoardCell)
def track_prize_placement_quests(sender, instance, created, **kwargs):
    """
    Track quest progress when a prize is placed on a board.
    """
    if not created:
        return

    # Update quest progress
    update_quest_progress(
        user=instance.placed_by,
        quest_type="place_rewards",
        reading_group=instance.board.reading_group,
    )


@receiver(post_save, sender=UserReward)
def update_reward_summary_on_create(sender, instance, created, **kwargs):
    """Update reward summary when a new reward is created."""
    if created:
        update_reward_summary(instance.user, instance.reward_template)


@receiver(post_delete, sender=UserReward)
def update_reward_summary_on_delete(sender, instance, **kwargs):
    """Update reward summary when a reward is deleted."""
    update_reward_summary(instance.user, instance.reward_template)
