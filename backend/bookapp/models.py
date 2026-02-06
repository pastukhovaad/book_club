from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from .validators import (
    validate_epub_file_extension,
    validate_epub_file_size,
    validate_file_is_not_empty,
)

# Cyrillic to Latin transliteration map
CYRILLIC_TO_LATIN = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "yo",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "kh",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "shch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
    "А": "A",
    "Б": "B",
    "В": "V",
    "Г": "G",
    "Д": "D",
    "Е": "E",
    "Ё": "Yo",
    "Ж": "Zh",
    "З": "Z",
    "И": "I",
    "Й": "Y",
    "К": "K",
    "Л": "L",
    "М": "M",
    "Н": "N",
    "О": "O",
    "П": "P",
    "Р": "R",
    "С": "S",
    "Т": "T",
    "У": "U",
    "Ф": "F",
    "Х": "Kh",
    "Ц": "Ts",
    "Ч": "Ch",
    "Ш": "Sh",
    "Щ": "Shch",
    "Ъ": "",
    "Ы": "Y",
    "Ь": "",
    "Э": "E",
    "Ю": "Yu",
    "Я": "Ya",
}


def transliterate(text):
    """Transliterate Cyrillic characters to Latin."""
    return "".join(CYRILLIC_TO_LATIN.get(char, char) for char in text)


import os
import uuid


def unique_file_name(upload_path):
# Generate a unique file name using UUID
    def generate_unique_filename(instance, filename):

        ext = os.path.splitext(filename)[1]  
        unique_filename = f"{uuid.uuid4()}{ext}"
        return os.path.join(upload_path, unique_filename)

    return generate_unique_filename


class CustomUser(AbstractUser):
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to=unique_file_name("profile_img/"), blank=True, null=True)
    profile_picture_url = models.URLField(blank=True, null=True)
    job_title = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.username


class Hashtag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Хештег"
        verbose_name_plural = "Хештеги"
        ordering = ["name"]

    def __str__(self):
        return f"#{self.name}"

    def save(self, *args, **kwargs):
        self.name = self.name.strip().lstrip("#").lower()
        super().save(*args, **kwargs)


class Book(models.Model):
    VISIBILITY_CHOICES = (
        ("public", "Публичная (видимая всем)"),
        ("group", "Групповая (видимая только членам вашей группы)"),
        ("personal", "Личная (видимая только вам)"),
    )

    CATEGORY = (
        ("classic", "Классика"),
        ("fantasy", "Фэнтези"),
        ("detective_fiction", "Детектив"),
        ("thriller", "Триллер"),
        ("romance", "Романтика"),
        ("horror", "Ужасы"),
        ("adventure", "Приключения"),
        ("science_fiction", "Научная фантастика"),
        ("biography", "Биография"),
        ("self_help", "Саморазвитие"),
        ("poetry", "Поэзия"),
        ("children", "Детская литература"),
        ("non_fiction", "Документальная литература"),
        ("business", "Бизнес и экономика"),
        ("other", "Другое"),
    )


    CONTENT_TYPE = (
        ("plaintext", "Plain Text"),
        ("epub", "EPUB"),
    )

    title = models.CharField(max_length=255)
    book_author = models.CharField(max_length=255, blank=True, default="", verbose_name="Автор книги")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    content_type = models.CharField(
        max_length=20, choices=CONTENT_TYPE, default="plaintext"
    )
    epub_file = models.FileField(
        upload_to=unique_file_name("epub_files/"),
        blank=True,
        null=True,
        validators=[
            validate_epub_file_extension,
            validate_epub_file_size,
            validate_file_is_not_empty,
        ],
    )
    table_of_contents = models.JSONField(blank=True, null=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="books",
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_date = models.DateTimeField(blank=True, null=True)
    is_draft = models.BooleanField(default=True)
    category = models.CharField(max_length=255, choices=CATEGORY, blank=True, null=True)
    featured_image = models.ImageField(upload_to=unique_file_name("book_img/"), blank=True, null=True)
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default="public",
    )
    reading_group = models.ForeignKey(
        "ReadingGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="books",
    )
    hashtags = models.ManyToManyField(
        "Hashtag",
        blank=True,
        related_name="books",
    )

    class Meta:
        ordering = ["-published_date"]

    def __str__(self):
        return self.title

        # def save(self, *args, **kwargs):
        #     base_slug = slugify(self.title)
        #     slug = base_slug
        #     num = 1
        #     while Book.objects.filter(slug=slug).exists():
        #         slug = f"{base_slug}-{num}"
        #         num += 1
        #     self.slug = slug

        #     if not self.is_draft and self.published_date is None:
        #         self.published_date = timezone.now()

        super().save(*args, **kwargs)

    def save(self, *args, **kwargs):
        # Transliterate title to Latin characters before slugifying
        transliterated_title = transliterate(self.title)
        base_slug = slugify(transliterated_title)
        slug = base_slug
        num = 1
        while Book.objects.filter(slug=slug).exclude(id=self.id).exists():
            slug = f"{base_slug}-{num}"
            num += 1
        self.slug = slug

        if not self.is_draft and self.published_date is None:
            self.published_date = timezone.now()

        
        super().save(*args, **kwargs)


class ReadingGroup(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reading_groups_creator",
        null=True,
    )
    user = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="UserToReadingGroupState",
        related_name="reading_groups_user",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    featured_image = models.ImageField(
        upload_to=unique_file_name("reading_group_img/"), blank=True, null=True
    )
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    # updated_at = models.DateTimeField(auto_now=True)
    # published_date = models.DateTimeField(blank=True, null=True)
    # is_draft = models.BooleanField(default=True)
    # featured_image = models.ImageField(upload_to="book_img", blank=True, null=True)

    # class Meta:
    #     ordering = ["-published_date"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Transliterate name to Latin characters before slugifying
        transliterated_name = transliterate(self.name)
        base_slug = slugify(transliterated_name)
        slug = base_slug
        num = 1
        while ReadingGroup.objects.filter(slug=slug).exclude(id=self.id).exists():
            slug = f"{base_slug}-{num}"
            num += 1
        self.slug = slug

        super().save(*args, **kwargs)


class UserToReadingGroupState(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    reading_group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
    )
    in_reading_group = models.BooleanField(default=False)
    # requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["in_reading_group"]

    def __str__(self):
        return f"{self.user.username} - {self.reading_group.name} - {self.in_reading_group}"


class Notification(models.Model):

    CATEGORY = (
        ("GroupJoinRequest", "GroupJoinRequest"),
        ("GroupRequestDeclined", "GroupRequestDeclined"),
        ("GroupRequestAccepted", "GroupRequestAccepted"),
        ("GroupKick", "GroupKick"),
        ("QuestCompleted", "QuestCompleted"),
    )

    directed_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="directed_to",
        null=True,
        blank=True,
    )
    related_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="related_to",
        null=True,
        blank=True,
    )

    related_group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.SET_NULL,
        related_name="related_group",
        null=True,
        blank=True,
    )
    related_quest = models.ForeignKey(
        "Quest",
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True,
        blank=True,
        verbose_name="Связанное задание",
    )
    related_reward = models.ForeignKey(
        "RewardTemplate",
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True,
        blank=True,
        verbose_name="Связанная награда",
    )

    extra_text = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=255, choices=CATEGORY, blank=True, null=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return self.extra_text


class BookComment(models.Model):
    """Model for storing comments linked to specific text locations in EPUB books."""

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="comments")
    reading_group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
        related_name="book_comments",
        null=True,
        blank=True,
        help_text="Reading group this comment belongs to (null for personal comments)",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="book_comments"
    )

    # Parent comment for replies (null for root comments)
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True,
        help_text="Parent comment if this is a reply (null for root comments)",
    )

    # Text location data (EPUB CFI - Canonical Fragment Identifier)
    # These fields are optional for replies (replies don't have their own text selection)
    cfi_range = models.TextField(
        blank=True,
        null=True,
        help_text="EPUB CFI range identifying the exact text location (null for replies)",
    )
    selected_text = models.TextField(
        blank=True,
        null=True,
        help_text="The actual text that was selected and commented on (null for replies)",
    )

    # Comment content
    comment_text = models.TextField()

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Visual customization
    highlight_color = models.CharField(
        max_length=7,
        default="#FFFF00",
        help_text="Hex color code for highlighting the commented text",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["book", "reading_group"]),
            models.Index(fields=["user", "reading_group"]),
            models.Index(fields=["book", "user"]),  # For personal comments
            models.Index(fields=["parent_comment"]),  # For fetching replies
        ]

    def __str__(self):
        return (
            f"{self.user.username} on {self.book.title[:30]} - {self.comment_text[:50]}"
        )

    @property
    def is_reply(self):
        """Check if this comment is a reply to another comment."""
        return self.parent_comment is not None

    @property
    def replies_count(self):
        """Get the number of replies to this comment."""
        return self.replies.count()


class BookReview(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    title = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Название"
    )
    description = models.TextField(
        max_length=1000, null=False, blank=False, verbose_name="Описание"
    )
    stars_amount = models.IntegerField(null=False, blank=False, verbose_name="Звезды")
    creation_date = models.DateField(
        null=False, blank=False, verbose_name="Дата создания"
    )
    likes = models.JSONField(verbose_name="Лайки")

    class Meta:
        verbose_name = "Отзыв к книге"
        verbose_name_plural = "Отзывы к книге"

    def __str__(self):
        return self.title


# ============================================================================
# Gamification Models
# ============================================================================


class RewardTemplate(models.Model):
    """Template for rewards that can be earned by completing quests."""

    name = models.CharField(max_length=200, verbose_name="Название")
    image = models.ImageField(upload_to=unique_file_name("rewards/"), verbose_name="Изображение")

    class Meta:
        verbose_name = "Шаблон приза"
        verbose_name_plural = "Шаблоны призов"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}"


class UserReward(models.Model):
    """Rewards earned by users through quest completion."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rewards",
        verbose_name="Пользователь",
    )
    reward_template = models.ForeignKey(
        RewardTemplate,
        on_delete=models.CASCADE,
        related_name="user_rewards",
        verbose_name="Шаблон приза",
    )
    quest_completed = models.ForeignKey(
        "QuestCompletion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rewards_given",
        verbose_name="Задание",
        help_text="За какое задание получен приз",
    )
    received_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата получения")

    class Meta:
        verbose_name = "Полученный приз"
        verbose_name_plural = "Полученные призы"
        ordering = ["-received_at"]

    def __str__(self):
        return f"{self.user.username} - {self.reward_template.name}"


class UserRewardSummary(models.Model):
    """Aggregated reward counts per user and reward template."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reward_summaries",
        verbose_name="Пользователь",
    )
    reward_template = models.ForeignKey(
        RewardTemplate,
        on_delete=models.CASCADE,
        related_name="reward_summaries",
        verbose_name="Шаблон приза",
    )
    total_count = models.PositiveIntegerField(default=0, verbose_name="Количество")
    last_received_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Последняя дата получения"
    )

    class Meta:
        verbose_name = "Сводка по призам"
        verbose_name_plural = "Сводки по призам"
        unique_together = ["user", "reward_template"]
        indexes = [
            models.Index(fields=["user", "reward_template"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.reward_template.name}: {self.total_count}"


class Quest(models.Model):
    """Quest/Challenge that users can complete to earn rewards."""

    PERIOD_CHOICES = [
        ("day", "День"),
        ("week", "Неделя"),
        ("month", "Месяц"),
    ]

    QUEST_TYPE_CHOICES = [
        ("read_books", "Прочитать книги"),
        ("create_comments", "Оставить комментарии"),
        ("reply_comments", "Ответить на комментарии"),
        ("place_rewards", "Разместить призы"),
    ]

    PARTICIPATION_CHOICES = [
        ("personal", "Персональное"),
        ("group", "Групповое"),
    ]

    title = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    quest_type = models.CharField(
        max_length=50, choices=QUEST_TYPE_CHOICES, verbose_name="Тип задания"
    )
    target_count = models.PositiveIntegerField(
        verbose_name="Целевое количество", help_text="Сколько нужно выполнить действий"
    )
    period = models.CharField(
        max_length=20, choices=PERIOD_CHOICES, verbose_name="Период"
    )
    participation_type = models.CharField(
        max_length=20, choices=PARTICIPATION_CHOICES, verbose_name="Тип участия"
    )

    reward_template = models.ForeignKey(
        RewardTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quests",
        verbose_name="Приз",
    )

    reading_group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quests",
        verbose_name="Группа чтения",
        help_text="Если null - глобальное задание",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_quests",
        verbose_name="Создатель",
    )

    start_date = models.DateTimeField(verbose_name="Дата начала")
    end_date = models.DateTimeField(verbose_name="Дата окончания")
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    is_completed = models.BooleanField(
        default=False,
        verbose_name="Завершено",
        help_text="Задание выполнено и награды розданы",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Задание"
        verbose_name_plural = "Задания"
        ordering = ["-created_at"]

    def __str__(self):
        scope = f"({self.reading_group.name})" if self.reading_group else "(Глобальное)"
        return f"{self.title} {scope}"


class QuestProgress(models.Model):
    """Tracks user progress on active quests."""

    quest = models.ForeignKey(
        Quest,
        on_delete=models.CASCADE,
        related_name="progress_records",
        verbose_name="Задание",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quest_progress",
        verbose_name="Пользователь",
    )
    current_count = models.PositiveIntegerField(
        default=0, verbose_name="Текущий прогресс"
    )
    last_updated = models.DateTimeField(
        auto_now=True, verbose_name="Последнее обновление"
    )

    class Meta:
        verbose_name = "Прогресс задания"
        verbose_name_plural = "Прогресс заданий"
        unique_together = ["quest", "user"]
        indexes = [
            models.Index(fields=["quest", "user"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.quest.title}: {self.current_count}/{self.quest.target_count}"


class QuestCompletion(models.Model):
    """Records completed quests and issued rewards."""

    quest = models.ForeignKey(
        Quest,
        on_delete=models.CASCADE,
        related_name="completions",
        verbose_name="Задание",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="completed_quests",
        verbose_name="Пользователь",
        help_text="Для персональных заданий",
    )
    reading_group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="completed_quests",
        verbose_name="Группа чтения",
        help_text="Для групповых заданий",
    )
    completed_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Дата завершения"
    )

    class Meta:
        verbose_name = "Завершённое задание"
        verbose_name_plural = "Завершённые задания"
        ordering = ["-completed_at"]

    def __str__(self):
        return f"{self.user.username} завершил {self.quest.title}"


class PrizeBoard(models.Model):
    """Grid board for displaying rewards within a reading group or for a user."""

    BOARD_TYPE_CHOICES = [
        ("group", "Группа"),
        ("user", "Пользователь"),
    ]

    reading_group = models.OneToOneField(
        ReadingGroup,
        on_delete=models.CASCADE,
        related_name="prize_board",
        verbose_name="Группа чтения",
        null=True,
        blank=True,
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prize_board",
        verbose_name="Пользователь",
        null=True,
        blank=True,
    )
    board_type = models.CharField(
        max_length=10,
        choices=BOARD_TYPE_CHOICES,
        default="group",
        verbose_name="Тип доски",
    )
    width = models.PositiveIntegerField(
        default=5, verbose_name="Ширина", help_text="Количество колонок"
    )
    height = models.PositiveIntegerField(
        default=5, verbose_name="Высота", help_text="Количество строк"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Поле для призов"
        verbose_name_plural = "Поля для призов"

    def clean(self):
        if self.board_type == "group" and not self.reading_group:
            raise ValidationError(
                "Для группового типа необходимо указать группу чтения."
            )
        if self.board_type == "user" and not self.user:
            raise ValidationError(
                "Для пользовательского типа необходимо указать пользователя."
            )

    def __str__(self):
        if self.board_type == "user" and self.user:
            return f"Поле призов {self.user.username} ({self.width}x{self.height})"
        if self.reading_group:
            return f"Поле призов {self.reading_group.name} ({self.width}x{self.height})"
        return f"Поле призов #{self.pk} ({self.width}x{self.height})"


class PrizeBoardCell(models.Model):
    """Individual cell on a prize board containing a placed reward."""

    board = models.ForeignKey(
        PrizeBoard, on_delete=models.CASCADE, related_name="cells", verbose_name="Поле"
    )
    x = models.PositiveIntegerField(verbose_name="Координата X")
    y = models.PositiveIntegerField(verbose_name="Координата Y")
    user_reward = models.ForeignKey(
        UserReward,
        on_delete=models.CASCADE,
        related_name="board_placements",
        verbose_name="Приз пользователя",
    )
    placed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placed_rewards",
        verbose_name="Размещено пользователем",
    )
    placed_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата размещения")

    class Meta:
        verbose_name = "Ячейка поля призов"
        verbose_name_plural = "Ячейки поля призов"
        unique_together = ["board", "x", "y"]
        indexes = [
            models.Index(fields=["board", "x", "y"]),
        ]

    def __str__(self):
        return f"{self.board} ({self.x}, {self.y}) - {self.user_reward.reward_template.name}"


class ReadingProgress(models.Model):
    """Tracks user's reading progress through books."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reading_progress",
        verbose_name="Пользователь",
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="reading_progress",
        verbose_name="Книга",
    )
    current_cfi = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Текущая позиция",
        help_text="EPUB CFI - текущая позиция в книге",
    )

    character_offset = models.IntegerField(
        default=0,
        verbose_name="Позиция символа",
        help_text="Индекс первого символа на текущей странице (для TXT)",
    )

    progress_percent = models.FloatField(
        default=0, verbose_name="Прогресс (%)", help_text="Процент прочитанного (0-100)"
    )
    is_completed = models.BooleanField(default=False, verbose_name="Завершено")
    last_read_at = models.DateTimeField(auto_now=True, verbose_name="Последнее чтение")

    class Meta:
        verbose_name = "Прогресс чтения"
        verbose_name_plural = "Прогресс чтения"
        unique_together = ["user", "book"]
        indexes = [
            models.Index(fields=["user", "book"]),
            models.Index(fields=["user", "is_completed"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.book.title}: {self.progress_percent}%"


class UserStats(models.Model):
    """Aggregated statistics for each user's activity."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stats",
        verbose_name="Пользователь",
    )
    total_quests_completed = models.PositiveIntegerField(
        default=0, verbose_name="Всего заданий выполнено"
    )
    total_books_read = models.PositiveIntegerField(
        default=0, verbose_name="Всего книг прочитано"
    )
    total_comments_created = models.PositiveIntegerField(
        default=0, verbose_name="Всего комментариев создано"
    )
    total_replies_created = models.PositiveIntegerField(
        default=0, verbose_name="Всего ответов создано"
    )
    total_rewards_received = models.PositiveIntegerField(
        default=0, verbose_name="Всего призов получено"
    )

    class Meta:
        verbose_name = "Статистика пользователя"
        verbose_name_plural = "Статистика пользователей"

    def __str__(self):
        return f"Статистика {self.user.username}"
