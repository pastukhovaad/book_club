"""
Reading progress tracking views.

Handles user reading progress for books, including progress updates and completion tracking.
"""

import logging
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import ReadingProgress, Book, CustomUser
from ..serializers import ReadingProgressSerializer

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_reading_progress(request, slug):
    """Get user's reading progress for a book."""
    user = request.user

    try:
        book = Book.objects.get(slug=slug)

        try:
            progress = ReadingProgress.objects.get(user=user, book=book)
            serializer = ReadingProgressSerializer(progress)
            return Response(serializer.data)
        except ReadingProgress.DoesNotExist:
            # Return default progress if not started
            return Response(
                {
                    "id": None,
                    "user": user.id,
                    "book": {"id": book.id, "title": book.title, "slug": book.slug},
                    "current_cfi": "",
                    "character_offset": 0,
                    "progress_percent": 0,
                    "is_completed": False,
                    "last_read_at": None,
                }
            )
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_reading_progress(request, slug):
    """Update user's reading progress for a book."""
    user = request.user

    try:
        book = Book.objects.get(slug=slug)

        progress, created = ReadingProgress.objects.get_or_create(user=user, book=book)

        serializer = ReadingProgressSerializer(
            progress, data=request.data, partial=True
        )
        if serializer.is_valid():

        
            saved_progress = serializer.save()

            # Calculate progress_percent based on book content type
            calculated_percent = None

            if book.content_type == "plaintext" and book.content:
                # For TXT books: calculate from character_offset / total_characters
                total_chars = len(book.content)
                if total_chars > 0 and saved_progress.character_offset >= 0:
                    calculated_percent = (
                        saved_progress.character_offset / total_chars
                    ) * 100
            elif book.content_type == "epub":
                # For EPUB books: use progress_percent from request (sent by frontend)
                request_percent = request.data.get("progress_percent")
                if request_percent is not None:
                    try:
                        calculated_percent = float(request_percent)
                    except (TypeError, ValueError):
                        pass

            # Update progress_percent if calculated
            if calculated_percent is not None:
                saved_progress.progress_percent = min(calculated_percent, 100)

                # Auto-complete if progress >= 95%
                if (
                    saved_progress.progress_percent >= 95
                    and not saved_progress.is_completed
                ):
                    saved_progress.is_completed = True
                    saved_progress.progress_percent = 100

                saved_progress.save()

            return Response(ReadingProgressSerializer(saved_progress).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_book(request, slug):
    """Mark a book as completed."""
    user = request.user

    try:
        book = Book.objects.get(slug=slug)

        progress, created = ReadingProgress.objects.get_or_create(user=user, book=book)

        progress.is_completed = True
        progress.progress_percent = 100
        progress.save()

        serializer = ReadingProgressSerializer(progress)
        return Response(serializer.data)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
