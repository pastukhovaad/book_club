from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Book, BookComment, Notification, ReadingGroup, UserToReadingGroupState


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
            "facebook",
            "youtube",
            "instagram",
            "twitter",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Сделаем поля необязательными
        self.fields["profile_picture"].required = False
        self.fields["facebook"].required = False
        self.fields["youtube"].required = False
        self.fields["instagram"].required = False
        self.fields["twitter"].required = False


    def update(self, instance, validated_data):
        # Если profile_picture не в initial_data, не обновляем его
        if "profile_picture" not in self.initial_data:
            validated_data.pop("profile_picture", None)

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




class BookSerializer(serializers.ModelSerializer):
    author = SimpleAuthorSerializer(read_only=True)
    epub_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Book

        fields = [
            "id",
            "title",
            "slug",
            "author",
            "category",
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
        ]

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
            representation["processed_content"] = text_formating(content) if content else ""
            representation["has_epub"] = False

        return representation

    def validate(self, data):
        """Validate that content or epub_file is provided based on content_type."""
        content_type = data.get('content_type', 'plaintext')

        if content_type == 'epub':
            if not data.get('epub_file') and not self.instance:
                raise serializers.ValidationError(
                    "EPUB file is required when content_type is 'epub'"
                )
        elif content_type == 'plaintext':
            if not data.get('content') and not self.instance:
                raise serializers.ValidationError(
                    "Content is required when content_type is 'plaintext'"
                )

        return data


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
        reading_group_id = self.context.get('reading_group_id')
        if reading_group_id:
            try:
                state = UserToReadingGroupState.objects.get(
                    user=obj,
                    reading_group_id=reading_group_id
                )
                return state.in_reading_group
            except UserToReadingGroupState.DoesNotExist:
                return False
        return False


class ReadingGroupSerializer(serializers.ModelSerializer):  # REM
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
            users,
            many=True,
            context={'reading_group_id': obj.id}
        )
        return serializer.data


class NotificationSerializer(serializers.ModelSerializer):
    directed_to = SimpleAuthorSerializer(read_only=True)
    related_to = SimpleAuthorSerializer(read_only=True)
    related_group = ReadingGroupSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "directed_to",
            "related_to",
            "related_group",
            "extra_text",
            "sent_at",
            "category",
        ]


class UserInfoSerializer(serializers.ModelSerializer):
    author_posts = serializers.SerializerMethodField()

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
        ]


    def get_author_posts(self, user):
        books = Book.objects.filter(author=user)[:9]
        serializer = BookSerializer(books, many=True, context=self.context)
        return serializer.data


class UserToReadingGroupStateSerializer(serializers.ModelSerializer):  # REM
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
    book_slug = serializers.CharField(source='book.slug', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    reading_group_slug = serializers.CharField(source='reading_group.slug', read_only=True, allow_null=True)
    reading_group_name = serializers.CharField(source='reading_group.name', read_only=True, allow_null=True)
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
        read_only_fields = ["id", "user", "created_at", "updated_at", "replies_count", "is_reply"]

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
        request = self.context.get('request')
        if request and request.user:
            reading_group = data.get('reading_group')
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
        request = self.context.get('request')
        parent_comment = self.context.get('parent_comment')

        if not parent_comment:
            raise serializers.ValidationError("Parent comment is required")

        if request and request.user:
            reading_group = parent_comment.reading_group
            # For group comments, check if user is a confirmed member
            if reading_group:
                try:
                    membership = UserToReadingGroupState.objects.get(
                        user=request.user,
                        reading_group=reading_group
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
