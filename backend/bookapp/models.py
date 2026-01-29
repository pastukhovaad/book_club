from django.conf import settings
from django.contrib.auth.models import AbstractUser
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
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
}


def transliterate(text):
    """Transliterate Cyrillic characters to Latin."""
    return ''.join(CYRILLIC_TO_LATIN.get(char, char) for char in text)


# Create your models here.


class CustomUser(AbstractUser):
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to="profile_img", blank=True, null=True)
    profile_picture_url = models.URLField(blank=True, null=True)
    job_title = models.CharField(max_length=50, blank=True, null=True)

    facebook = models.URLField(max_length=255, blank=True, null=True)
    youtube = models.URLField(max_length=255, blank=True, null=True)
    instagram = models.URLField(max_length=255, blank=True, null=True)
    twitter = models.URLField(max_length=255, blank=True, null=True)
    linkedin = models.URLField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username


class Book(models.Model):

    CATEGORY = (
        ("Science Fiction", "Science Fiction"),
        ("Fantasy", "Fantasy"),
        ("Detective Fiction", "Detective Fiction"),
        ("Thriller", "Thriller"),
        ("Romance", "Romance"),
        ("Horror", "Horror"),
        ("Historical Fiction", "Historical Fiction"),
        ("Adventure", "Adventure"),
    )

    CONTENT_TYPE = (
        ("plaintext", "Plain Text"),
        ("epub", "EPUB"),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    content_type = models.CharField(
        max_length=20, choices=CONTENT_TYPE, default="plaintext"
    )
    epub_file = models.FileField(
        upload_to="epub_files/",
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
    featured_image = models.ImageField(upload_to="book_img", blank=True, null=True)

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


class ReadingGroup(models.Model):  # REM
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
        upload_to="reading_group_img", blank=True, null=True
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


class UserToReadingGroupState(models.Model):  # REM
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

    extra_text = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=255, choices=CATEGORY, blank=True, null=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return self.extra_text


class BookComment(models.Model):
    """Model for storing comments linked to specific text locations in EPUB books."""

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    reading_group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
        related_name='book_comments',
        null=True,
        blank=True,
        help_text="Reading group this comment belongs to (null for personal comments)"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='book_comments'
    )

    # Parent comment for replies (null for root comments)
    parent_comment = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        null=True,
        blank=True,
        help_text="Parent comment if this is a reply (null for root comments)"
    )

    # Text location data (EPUB CFI - Canonical Fragment Identifier)
    # These fields are optional for replies (replies don't have their own text selection)
    cfi_range = models.TextField(
        blank=True,
        null=True,
        help_text="EPUB CFI range identifying the exact text location (null for replies)"
    )
    selected_text = models.TextField(
        blank=True,
        null=True,
        help_text="The actual text that was selected and commented on (null for replies)"
    )

    # Comment content
    comment_text = models.TextField()

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Visual customization
    highlight_color = models.CharField(
        max_length=7,
        default='#FFFF00',
        help_text="Hex color code for highlighting the commented text"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['book', 'reading_group']),
            models.Index(fields=['user', 'reading_group']),
            models.Index(fields=['book', 'user']),  # For personal comments
            models.Index(fields=['parent_comment']),  # For fetching replies
        ]

    def __str__(self):
        return f"{self.user.username} on {self.book.title[:30]} - {self.comment_text[:50]}"

    @property
    def is_reply(self):
        """Check if this comment is a reply to another comment."""
        return self.parent_comment is not None

    @property
    def replies_count(self):
        """Get the number of replies to this comment."""
        return self.replies.count()
