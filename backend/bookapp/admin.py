from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    Book,
    BookComment,
    CustomUser,
    Notification,
    PrizeBoard,
    PrizeBoardCell,
    Quest,
    QuestCompletion,
    QuestProgress,
    ReadingGroup,
    ReadingProgress,
    RewardTemplate,
    UserReward,
    UserRewardSummary,
    UserStats,
    UserToReadingGroupState,
)

# Register your models here.


class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "first_name",
        "last_name",
        "email",
        "job_title",
        "profile_picture",
        "profile_picture_url",
    )

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "bio",
                    "profile_picture",
                    "job_title",
                    "facebook",
                    "twitter",
                    "instagram",
                    "linkedin",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            None,
            {
                "fields": (
                    "bio",
                    "profile_picture",
                    "job_title",
                    "facebook",
                    "twitter",
                    "instagram",
                    "linkedin",
                )
            },
        ),
    )


admin.site.register(CustomUser, CustomUserAdmin)


class BookAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "visibility",
        "reading_group",
        "is_draft",
        "category",
        "created_at",
        "description",
    )


admin.site.register(Book, BookAdmin)


class ReadingGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")


admin.site.register(ReadingGroup, ReadingGroupAdmin)


class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "directed_to",
        "related_to",
        "extra_text",
        "category",
    )


admin.site.register(Notification, NotificationAdmin)


class UserToReadingGroupStateAdmin(admin.ModelAdmin):
    list_display = ("user", "reading_group", "in_reading_group")


admin.site.register(UserToReadingGroupState, UserToReadingGroupStateAdmin)


class BookCommentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "book",
        "reading_group",
        "parent_comment",
        "created_at",
        "comment_text",
    )


admin.site.register(BookComment, BookCommentAdmin)


# ============================================================================
# Gamification Admin
# ============================================================================


class RewardTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "image")


admin.site.register(RewardTemplate, RewardTemplateAdmin)


class UserRewardAdmin(admin.ModelAdmin):
    list_display = ("user", "reward_template", "quest_completed", "received_at")
    list_filter = ("received_at", "reward_template")
    search_fields = ("user__username", "reward_template__name")


admin.site.register(UserReward, UserRewardAdmin)


class UserRewardSummaryAdmin(admin.ModelAdmin):
    list_display = ("user", "reward_template", "total_count", "last_received_at")
    list_filter = ("reward_template",)
    search_fields = ("user__username", "reward_template__name")


admin.site.register(UserRewardSummary, UserRewardSummaryAdmin)


class QuestAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "quest_type",
        "participation_type",
        "target_count",
        "reading_group",
        "is_active",
        "start_date",
        "end_date",
    )
    list_filter = ("quest_type", "participation_type", "is_active", "reading_group")
    search_fields = ("title", "description")


admin.site.register(Quest, QuestAdmin)


class QuestProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "quest", "current_count", "last_updated")
    list_filter = ("quest", "last_updated")
    search_fields = ("user__username", "quest__title")


admin.site.register(QuestProgress, QuestProgressAdmin)


class QuestCompletionAdmin(admin.ModelAdmin):
    list_display = ("user", "quest", "reading_group", "completed_at")
    list_filter = ("quest", "completed_at", "reading_group")
    search_fields = ("user__username", "quest__title")


admin.site.register(QuestCompletion, QuestCompletionAdmin)


class PrizeBoardAdmin(admin.ModelAdmin):
    list_display = ("reading_group", "width", "height", "created_at")
    list_filter = ("created_at",)
    search_fields = ("reading_group__name",)


admin.site.register(PrizeBoard, PrizeBoardAdmin)


class PrizeBoardCellAdmin(admin.ModelAdmin):
    list_display = ("board", "x", "y", "placed_by", "placed_at")
    list_filter = ("board", "placed_at")
    search_fields = ("placed_by__username", "board__reading_group__name")


admin.site.register(PrizeBoardCell, PrizeBoardCellAdmin)


class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "progress_percent", "is_completed", "last_read_at")
    list_filter = ("is_completed", "last_read_at")
    search_fields = ("user__username", "book__title")


admin.site.register(ReadingProgress, ReadingProgressAdmin)


class UserStatsAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "total_quests_completed",
        "total_books_read",
        "total_comments_created",
        "total_replies_created",
        "total_rewards_received",
    )
    search_fields = ("user__username",)


admin.site.register(UserStats, UserStatsAdmin)
