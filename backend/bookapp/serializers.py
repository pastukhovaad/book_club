from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from rest_framework import serializers

from .models import (
    Book,
    BookComment,
    BookReview,
    Hashtag,
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


def text_formating(content):
    processed_data = content
    return processed_data


class UpdateUserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(
        required=False, allow_null=True, allow_empty_file=True, write_only=True
    )

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "bio",
            "job_title",
            "profile_picture",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Сделаем поля необязательными
        self.fields["profile_picture"].required = False

    def update(self, instance, validated_data):
        # Если profile_picture не в initial_data, не обновляем его
        if "profile_picture" not in self.initial_data:
            validated_data.pop("profile_picture", None)
        # Если загружается новая картинка, удаляем старую из S3/MinIO
        elif "profile_picture" in validated_data and validated_data["profile_picture"]:
            if instance.profile_picture:
                instance.profile_picture.delete(save=False)

        return super().update(instance, validated_data)


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username", "first_name", "last_name", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        username = validated_data["username"]
        first_name = validated_data["first_name"]
        last_name = validated_data["last_name"]
        first_name = validated_data["first_name"]
        password = validated_data["password"]

        user = get_user_model()
        new_user = user.objects.create(
            username=username, first_name=first_name, last_name=last_name
        )
        new_user.set_password(password)
        new_user.save()
        return new_user


class SimpleAuthorSerializer(serializers.ModelSerializer):

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "profile_picture",
        ]


class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ["id", "name"]


class BookSerializer(serializers.ModelSerializer):
    author = SimpleAuthorSerializer(read_only=True)
    epub_file = serializers.FileField(required=False, allow_null=True)
    reading_group = serializers.PrimaryKeyRelatedField(
        queryset=ReadingGroup.objects.all(), required=False, allow_null=True
    )
    hashtags = HashtagSerializer(many=True, read_only=True)
    category_display = serializers.SerializerMethodField()

    class Meta:
        model = Book

        fields = [
            "id",
            "title",
            "book_author",
            "slug",
            "author",
            "category",
            "category_display",
            "description",
            "content",
            "content_type",
            "epub_file",
            "table_of_contents",
            "featured_image",
            "published_date",
            "created_at",
            "updated_at",
            "is_draft",
            "visibility",
            "reading_group",
            "hashtags",
        ]

    def get_category_display(self, obj):
        return dict(Book.CATEGORY).get(obj.category, "Unknown")

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Handle content based on content_type
        if instance.content_type == "epub":
            # For EPUB books, provide structured content
            representation["processed_content"] = None
            representation["chapters"] = instance.table_of_contents or []
            representation["has_epub"] = True
        else:
            # For plain text books, use existing formatting
            content = representation.get("content", "")
            representation["processed_content"] = (
                text_formating(content) if content else ""
            )
            representation["has_epub"] = False

        return representation

    def validate(self, data):
        """Validate that content or epub_file is provided based on content_type."""
        content_type = data.get("content_type", "plaintext")

        if content_type == "epub":
            if not data.get("epub_file") and not self.instance:
                raise serializers.ValidationError(
                    "EPUB file is required when content_type is 'epub'"
                )
        elif content_type == "plaintext":
            if not data.get("content") and not self.instance:
                raise serializers.ValidationError(
                    "Content is required when content_type is 'plaintext'"
                )

        return data




class BookSerializerInfo(serializers.ModelSerializer):
    author = SimpleAuthorSerializer(read_only=True)
    reading_group = serializers.PrimaryKeyRelatedField(
        queryset=ReadingGroup.objects.all(), required=False, allow_null=True
    )
    average_rating = serializers.SerializerMethodField()
    hashtags = HashtagSerializer(many=True, read_only=True)
    category_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Book

        fields = [
            "id",
            "title",
            "book_author",
            "slug",
            "author",
            "category_display",
            "description",
            "content_type",
            "featured_image",
            "published_date",
            "created_at",
            "updated_at",
            "is_draft",
            "visibility",
            "reading_group",
            "average_rating",
            "hashtags",
        ]

    def get_category_display(self, obj):
        return dict(Book.CATEGORY).get(obj.category, "Unknown")

    

    def get_average_rating(self, instance):
        rating = BookReview.objects.filter(book=instance).aggregate(
            avg=Avg("stars_amount")
        )
        return rating["avg"]












class BookReviewSerializer(serializers.ModelSerializer):
    user = SimpleAuthorSerializer(read_only=True)
    book = serializers.PrimaryKeyRelatedField(read_only=True)
    stars_amount = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, default=""
    )

    class Meta:
        model = BookReview
        fields = [
            "id",
            "user",
            "book",
            "title",
            "description",
            "stars_amount",
            "creation_date",
            "likes",
        ]
        read_only_fields = ["id", "user", "book", "creation_date", "likes"]

    def validate_description(self, value):
        return value or ""


class UserWithStatusSerializer(serializers.ModelSerializer):
    """Serializer for users that includes their in_reading_group status."""

    in_reading_group = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "profile_picture",
            "in_reading_group",
        ]

    def get_in_reading_group(self, obj):
        """Get the in_reading_group status from the through table."""
        reading_group_id = self.context.get("reading_group_id")
        if reading_group_id:
            try:
                state = UserToReadingGroupState.objects.get(
                    user=obj, reading_group_id=reading_group_id
                )
                return state.in_reading_group
            except UserToReadingGroupState.DoesNotExist:
                return False
        return False


class ReadingGroupSerializer(serializers.ModelSerializer):
    creator = SimpleAuthorSerializer(read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = ReadingGroup
        fields = [
            "id",
            "name",
            "slug",
            "creator",
            "created_at",
            "featured_image",
            "user",
            "description",
        ]

    def get_user(self, obj):
        """Get all users with their in_reading_group status."""
        users = obj.user.all()
        serializer = UserWithStatusSerializer(
            users, many=True, context={"reading_group_id": obj.id}
        )
        return serializer.data


class NotificationSerializer(serializers.ModelSerializer):
    directed_to = SimpleAuthorSerializer(read_only=True)
    related_to = SimpleAuthorSerializer(read_only=True)
    related_group = ReadingGroupSerializer(read_only=True)
    related_quest = serializers.SerializerMethodField()
    related_reward = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "directed_to",
            "related_to",
            "related_group",
            "related_quest",
            "related_reward",
            "extra_text",
            "sent_at",
            "category",
        ]

    def get_related_quest(self, obj):
        """Return quest data if related_quest exists."""
        if obj.related_quest:
            return {
                "id": obj.related_quest.id,
                "title": obj.related_quest.title,
            }
        return None

    def get_related_reward(self, obj):
        """Return reward data if related_reward exists."""
        if obj.related_reward:
            from .models import RewardTemplate

            return {
                "id": obj.related_reward.id,
                "name": obj.related_reward.name,
                "image": (
                    obj.related_reward.image.url if obj.related_reward.image else None
                ),
            }
        return None


class UserInfoSerializer(serializers.ModelSerializer):
    author_posts = serializers.SerializerMethodField()
    reading_groups = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "job_title",
            "bio",
            "profile_picture",
            "author_posts",
            "reading_groups",
        ]

    def get_author_posts(self, user):
        books = Book.objects.filter(author=user)[:9]
        serializer = BookSerializerInfo(books, many=True, context=self.context)
        return serializer.data

    def get_reading_groups(self, user):
        groups = (
            UserToReadingGroupState.objects.filter(user=user, in_reading_group=True)
            .select_related("reading_group")
            .values_list("reading_group", flat=True)
        )
        reading_groups = ReadingGroup.objects.filter(id__in=groups)
        serializer = ReadingGroupSerializer(
            reading_groups, many=True, context=self.context
        )
        return serializer.data


class UserToReadingGroupStateSerializer(serializers.ModelSerializer):
    user = SimpleAuthorSerializer(read_only=True)
    reading_group = ReadingGroupSerializer(read_only=True)

    class Meta:
        model = UserToReadingGroupState
        fields = [
            "id",
            "user",
            "reading_group",
            "in_reading_group",
        ]


class BookCommentSerializer(serializers.ModelSerializer):
    """Serializer for book comments with user and book info."""

    user = SimpleAuthorSerializer(read_only=True)
    book_slug = serializers.CharField(source="book.slug", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)
    reading_group_slug = serializers.CharField(
        source="reading_group.slug", read_only=True, allow_null=True
    )
    reading_group_name = serializers.CharField(
        source="reading_group.name", read_only=True, allow_null=True
    )
    replies_count = serializers.IntegerField(read_only=True)
    is_reply = serializers.BooleanField(read_only=True)

    class Meta:
        model = BookComment
        fields = [
            "id",
            "book",
            "book_slug",
            "book_title",
            "reading_group",
            "reading_group_slug",
            "reading_group_name",
            "user",
            "parent_comment",
            "cfi_range",
            "selected_text",
            "comment_text",
            "highlight_color",
            "created_at",
            "updated_at",
            "replies_count",
            "is_reply",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
            "replies_count",
            "is_reply",
        ]

    def validate_cfi_range(self, value):
        """Validate that cfi_range is not empty for root comments."""
        # Allow empty cfi_range for replies
        return value

    def validate_comment_text(self, value):
        """Validate that comment text is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment text cannot be empty")
        return value


class BookCommentCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating comments."""

    class Meta:
        model = BookComment
        fields = [
            "book",
            "reading_group",
            "cfi_range",
            "selected_text",
            "comment_text",
            "highlight_color",
        ]

    def validate(self, data):
        """Validate that the user is a member of the reading group (if group is specified)."""
        request = self.context.get("request")
        if request and request.user:
            reading_group = data.get("reading_group")
            # Check if user is a member of the reading group (only for group comments)
            if reading_group:
                if not reading_group.user.filter(id=request.user.id).exists():
                    raise serializers.ValidationError(
                        "You must be a member of the reading group to comment"
                    )
            # If reading_group is None, it's a personal comment - no additional validation needed
        return data


class CommentReplySerializer(serializers.ModelSerializer):
    """Serializer for comment replies."""

    user = SimpleAuthorSerializer(read_only=True)

    class Meta:
        model = BookComment
        fields = [
            "id",
            "user",
            "parent_comment",
            "comment_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "parent_comment", "created_at", "updated_at"]


class CommentReplyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating replies to comments."""

    class Meta:
        model = BookComment
        fields = [
            "comment_text",
        ]

    def validate_comment_text(self, value):
        """Validate that comment text is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Reply text cannot be empty")
        return value

    def validate(self, data):
        """Validate that the user has access to the parent comment's group."""
        request = self.context.get("request")
        parent_comment = self.context.get("parent_comment")

        if not parent_comment:
            raise serializers.ValidationError("Parent comment is required")

        if request and request.user:
            reading_group = parent_comment.reading_group
            # For group comments, check if user is a confirmed member
            if reading_group:
                try:
                    membership = UserToReadingGroupState.objects.get(
                        user=request.user, reading_group=reading_group
                    )
                    if not membership.in_reading_group:
                        raise serializers.ValidationError(
                            "You must be a confirmed member of the reading group to reply"
                        )
                except UserToReadingGroupState.DoesNotExist:
                    raise serializers.ValidationError(
                        "You must be a member of the reading group to reply"
                    )
            else:
                # Personal comments - only the owner can reply (or we can disable replies)
                if parent_comment.user != request.user:
                    raise serializers.ValidationError(
                        "You cannot reply to other users' personal comments"
                    )

        return data


# ============================================================================
# Gamification Serializers
# ============================================================================


class RewardTemplateSerializer(serializers.ModelSerializer):
    """Serializer for reward templates."""

    class Meta:
        model = RewardTemplate
        fields = ["id", "name", "image"]


class UserRewardSerializer(serializers.ModelSerializer):
    """Serializer for user rewards."""

    user = SimpleAuthorSerializer(read_only=True)
    reward_template = RewardTemplateSerializer(read_only=True)
    quest_title = serializers.CharField(
        source="quest_completed.quest.title", read_only=True, allow_null=True
    )

    class Meta:
        model = UserReward
        fields = [
            "id",
            "user",
            "reward_template",
            "quest_completed",
            "quest_title",
            "received_at",
        ]
        read_only_fields = ["id", "user", "received_at"]


class UserRewardSummarySerializer(serializers.ModelSerializer):
    """Serializer for aggregated user reward counts."""

    user = SimpleAuthorSerializer(read_only=True)
    reward_template = RewardTemplateSerializer(read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    reward_template_id = serializers.IntegerField(
        source="reward_template.id", read_only=True
    )

    class Meta:
        model = UserRewardSummary
        fields = [
            "id",
            "user",
            "user_id",
            "reward_template",
            "reward_template_id",
            "total_count",
            "last_received_at",
        ]
        read_only_fields = ["id", "user", "reward_template"]


class QuestSerializer(serializers.ModelSerializer):
    """Serializer for quests."""

    created_by = SimpleAuthorSerializer(read_only=True)
    reward_template = RewardTemplateSerializer(read_only=True)
    reading_group_name = serializers.CharField(
        source="reading_group.name", read_only=True, allow_null=True
    )
    reading_group_slug = serializers.CharField(
        source="reading_group.slug", read_only=True, allow_null=True
    )

    class Meta:
        model = Quest
        fields = [
            "id",
            "title",
            "description",
            "quest_type",
            "target_count",
            "period",
            "participation_type",
            "reward_template",
            "reading_group",
            "reading_group_name",
            "reading_group_slug",
            "created_by",
            "start_date",
            "end_date",
            "is_active",
            "is_completed",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "is_completed"]


class QuestProgressSerializer(serializers.ModelSerializer):
    """Serializer for quest progress."""

    user = SimpleAuthorSerializer(read_only=True)
    quest = QuestSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = QuestProgress
        fields = [
            "id",
            "quest",
            "user",
            "current_count",
            "progress_percentage",
            "last_updated",
        ]
        read_only_fields = ["id", "user", "last_updated"]

    def get_progress_percentage(self, obj):
        """Calculate progress as percentage."""
        if obj.quest.target_count > 0:
            return min(100, (obj.current_count / obj.quest.target_count) * 100)
        return 0


class QuestCompletionSerializer(serializers.ModelSerializer):
    """Serializer for completed quests."""

    user = SimpleAuthorSerializer(read_only=True)
    quest = QuestSerializer(read_only=True)
    reading_group_name = serializers.CharField(
        source="reading_group.name", read_only=True, allow_null=True
    )

    class Meta:
        model = QuestCompletion
        fields = [
            "id",
            "quest",
            "user",
            "reading_group",
            "reading_group_name",
            "completed_at",
        ]
        read_only_fields = ["id", "user", "completed_at"]


class PrizeBoardSerializer(serializers.ModelSerializer):
    """Serializer for prize boards."""

    reading_group = ReadingGroupSerializer(read_only=True)
    user = SimpleAuthorSerializer(read_only=True)
    cells = serializers.SerializerMethodField()

    class Meta:
        model = PrizeBoard
        fields = [
            "id",
            "reading_group",
            "user",
            "board_type",
            "width",
            "height",
            "cells",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_cells(self, obj):
        """Get all cells with their rewards."""
        cells = PrizeBoardCell.objects.filter(board=obj).select_related(
            "user_reward__reward_template", "placed_by"
        )
        return PrizeBoardCellSerializer(cells, many=True).data


class PrizeBoardCellSerializer(serializers.ModelSerializer):
    """Serializer for prize board cells."""

    user_reward = UserRewardSerializer(read_only=True)
    placed_by = SimpleAuthorSerializer(read_only=True)

    class Meta:
        model = PrizeBoardCell
        fields = [
            "id",
            "board",
            "x",
            "y",
            "user_reward",
            "placed_by",
            "placed_at",
        ]
        read_only_fields = ["id", "placed_by", "placed_at"]


class ReadingProgressSerializer(serializers.ModelSerializer):
    """Serializer for reading progress."""

    user = SimpleAuthorSerializer(read_only=True)
    book = serializers.SerializerMethodField()

    class Meta:
        model = ReadingProgress
        fields = [
            "id",
            "user",
            "book",
            "current_cfi",
            "character_offset",
            "progress_percent",
            "is_completed",
            "last_read_at",
        ]
        read_only_fields = ["id", "user", "last_read_at"]

    def get_book(self, obj):
        """Return basic book info."""
        return {
            "id": obj.book.id,
            "title": obj.book.title,
            "slug": obj.book.slug,
            "featured_image": (
                obj.book.featured_image.url if obj.book.featured_image else None
            ),
        }


class UserStatsSerializer(serializers.ModelSerializer):
    """Serializer for user statistics."""

    user = SimpleAuthorSerializer(read_only=True)
    favorite_genre = serializers.SerializerMethodField()

    class Meta:
        model = UserStats
        fields = [
            "id",
            "user",
            "total_quests_completed",
            "total_books_read",
            "total_comments_created",
            "total_replies_created",
            "total_rewards_received",
            "favorite_genre",
        ]
        read_only_fields = ["id", "user"]

    def get_favorite_genre(self, instance):
        user = instance.user
        top = (
            ReadingProgress.objects.filter(user=user, is_completed=True)
            .exclude(book__category__isnull=True)
            .exclude(book__category="")
            .values("book__category")
            .annotate(total=Count("book__category"))
            .order_by("-total")
            .first()
        )
        top_display = dict(Book.CATEGORY).get(top["book__category"] )
        return  top_display if top_display else None
    
    


