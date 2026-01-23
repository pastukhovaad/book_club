from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

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

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    content = models.TextField()
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
        base_slug = slugify(self.title)
        slug = base_slug
        num = 1  # Possible REM below (on .exclude)
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
        base_slug = slugify(self.name)
        slug = base_slug
        num = 1
        while ReadingGroup.objects.filter(slug=slug).exclude(id=self.id).exists():
            slug = f"{base_slug}-{num}"
            num += 1
        self.slug = slug

        super().save(*args, **kwargs)


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
    
    extra_text = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    sent_date = models.DateTimeField(blank=True, null=True)
    category = models.CharField(max_length=255, choices=CATEGORY, blank=True, null=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return self.extra_text