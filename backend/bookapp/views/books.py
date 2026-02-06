"""
Book management views.

Handles book CRUD operations, EPUB file processing, and chapter retrieval.
"""

import logging
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Book, Hashtag, UserToReadingGroupState
from ..serializers import BookSerializer, BookSerializerInfo
from ..validators import validate_epub_file_complete
from ..epub_handler import EPUBHandler, parse_epub_file
from .utils import local_epub_path, AnyListPagination

logger = logging.getLogger(__name__)


@api_view(["GET"])
def book_list(request, amount):
    user = request.user if request.user.is_authenticated else None

    if user:
        user_group_ids = UserToReadingGroupState.objects.filter(
            user=user, in_reading_group=True
        ).values_list("reading_group_id", flat=True)

        books = Book.objects.filter(
            models.Q(visibility="public")
            | models.Q(visibility="personal", author=user)
            | models.Q(visibility="group", reading_group_id__in=user_group_ids)
        ).select_related('author', 'reading_group')
    else:
        books = Book.objects.filter(visibility="public").select_related('author', 'reading_group')
    paginator = AnyListPagination(amount=amount)
    paginated_books = paginator.paginate_queryset(books, request)
    serializer = BookSerializerInfo(paginated_books, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
def public_book_list(request, amount):
    # Optimize: select_related for author and reading_group foreign keys
    books = Book.objects.filter(visibility="public").select_related('author', 'reading_group')
    paginator = AnyListPagination(amount=amount)
    paginated_books = paginator.paginate_queryset(books, request)
    serializer = BookSerializerInfo(paginated_books, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
def get_book(request, slug):
    book = get_object_or_404(Book, slug=slug)

    if book.visibility == "personal":
        if not request.user.is_authenticated or book.author != request.user:
            return Response(
                {"error": "You do not have access to this book"},
                status=status.HTTP_403_FORBIDDEN,
            )

    if book.visibility == "group":
        if not request.user.is_authenticated:
            return Response(
                {"error": "You do not have access to this book"},
                status=status.HTTP_403_FORBIDDEN,
            )
        is_member = UserToReadingGroupState.objects.filter(
            user=request.user,
            reading_group=book.reading_group,
            in_reading_group=True,
        ).exists()
        if not is_member and book.author != request.user:
            return Response(
                {"error": "You do not have access to this book"},
                status=status.HTTP_403_FORBIDDEN,
            )
    if request.query_params.get("info_only", "false").lower() == "true":
            serializer = BookSerializerInfo(book)
    else:
            serializer = BookSerializer(book)

    return Response(serializer.data)


@api_view(["GET"])
def get_book_chapter(request, slug, chapter_id):
    """
    Get a specific chapter from an EPUB book.
    """
    try:
        book = Book.objects.get(slug=slug)

        # Check if book is EPUB format
        if book.content_type != "epub":
            return Response(
                {"error": "This book is not in EPUB format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not book.epub_file:
            return Response(
                {"error": "EPUB file not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Parse EPUB and get chapter
        with local_epub_path(book.epub_file) as epub_path:
            if not epub_path:
                return Response(
                    {"error": "EPUB file not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            handler = EPUBHandler(epub_path)
            chapter = handler.get_chapter_by_id(int(chapter_id))
            total_chapters = len(handler.get_chapters())

        if not chapter:
            return Response(
                {"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "book_title": book.title,
                "book_slug": book.slug,
                "chapter": chapter,
                "total_chapters": total_chapters,
            }
        )

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting chapter: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def get_book_chapters_list(request, slug):
    """
    Get list of all chapters with metadata (without full content).
    """
    try:
        book = Book.objects.get(slug=slug)

        if book.content_type != "epub":
            return Response(
                {"error": "This book is not in EPUB format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not book.epub_file:
            return Response(
                {"error": "EPUB file not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get chapters list from table of contents
        if book.table_of_contents:
            return Response(
                {
                    "book_title": book.title,
                    "book_slug": book.slug,
                    "chapters": book.table_of_contents,
                }
            )

        # Fallback: parse EPUB to get chapters
        with local_epub_path(book.epub_file) as epub_path:
            if not epub_path:
                return Response(
                    {"error": "EPUB file not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            handler = EPUBHandler(epub_path)
            chapters = handler.get_chapters()

        # Return only metadata, not full content
        chapters_metadata = [
            {"id": ch["id"], "title": ch["title"], "file_name": ch.get("file_name", "")}
            for ch in chapters
        ]

        return Response(
            {
                "book_title": book.title,
                "book_slug": book.slug,
                "chapters": chapters_metadata,
            }
        )

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting chapters list: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_book(request):
    user = request.user
    serializer = BookSerializer(data=request.data)

    if serializer.is_valid():
        visibility = serializer.validated_data.get("visibility", "public")
        reading_group = serializer.validated_data.get("reading_group")

        if visibility == "group" and not reading_group:
            return Response(
                {"reading_group": "Групповая книга требует выбора группы"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if visibility == "group" and reading_group and reading_group.creator != user:
            return Response(
                {"reading_group": "Вы не являетесь создателем этой группы"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if visibility == "personal":
            serializer.validated_data["reading_group"] = None

        # Save the book first
        book = serializer.save(author=user)

        # If EPUB file was uploaded, process it
        if book.content_type == "epub" and book.epub_file:
            try:
                # Validate EPUB file structure and safety
                with local_epub_path(book.epub_file) as epub_path:
                    if not epub_path:
                        raise ValueError("EPUB file not found")

                    is_valid, error_message = validate_epub_file_complete(epub_path)

                    if not is_valid:
                        logger.warning(
                            f"Invalid EPUB file uploaded by user {user.username}: {error_message}"
                        )
                        # Delete uploaded files from S3/MinIO before deleting the book record
                        if book.epub_file:
                            book.epub_file.delete(save=False)
                        if book.featured_image:
                            book.featured_image.delete(save=False)
                        book.delete()
                        return Response(
                            {"error": f"Invalid EPUB file: {error_message}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # Parse EPUB file
                    epub_data = parse_epub_file(epub_path)

                # Update book with parsed data
                book.table_of_contents = epub_data.get("table_of_contents", [])

                # Extract full text to content field for search/preview
                if not book.content:
                    book.content = epub_data.get("full_text", "")[
                        :1000
                    ]  # Store first 1000 chars as preview

                book.save()

                logger.info(
                    f"Successfully processed EPUB file for book '{book.title}' (ID: {book.id})"
                )

            except Exception as e:
                logger.error(f"Error processing EPUB file: {e}")
                # Delete uploaded files from S3/MinIO before deleting the book record
                if book.epub_file:
                    book.epub_file.delete(save=False)
                if book.featured_image:
                    book.featured_image.delete(save=False)
                book.delete()
                return Response(
                    {"error": f"Failed to process EPUB file: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Handle hashtags
        hashtag_names = request.data.getlist("hashtags")
        if hashtag_names:
            hashtag_objs = []
            for name in hashtag_names:
                name = name.strip().lstrip("#").lower()
                if name:
                    obj, _ = Hashtag.objects.get_or_create(name=name)
                    hashtag_objs.append(obj)
            book.hashtags.set(hashtag_objs)

        return Response(BookSerializer(book).data)
    logging.error(f"Book creation failed with errors: {serializer.errors} for user: {user.username}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_book(request, pk):
    user = request.user
    book = get_object_or_404(Book, id=pk)
    if book.author != user:
        return Response(
            {"error": "You are not the author of this book"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = BookSerializer(book, data=request.data, partial=True)

    if serializer.is_valid():
        visibility = serializer.validated_data.get("visibility", book.visibility)
        reading_group = serializer.validated_data.get(
            "reading_group", book.reading_group
        )

        if visibility == "group" and not reading_group:
            return Response(
                {"reading_group": "Групповая книга требует выбора группы"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if visibility == "personal":
            serializer.validated_data["reading_group"] = None

        # Save old files for deletion if they are being replaced
        old_epub_file = book.epub_file if "epub_file" in request.FILES and book.epub_file else None
        old_featured_image = book.featured_image if "featured_image" in request.FILES and book.featured_image else None

        updated_book = serializer.save()

        # Delete old files from S3/MinIO after successful update
        if old_epub_file:
            old_epub_file.delete(save=False)
        if old_featured_image:
            old_featured_image.delete(save=False)

        # If a new EPUB file was uploaded, process it
        if "epub_file" in request.FILES:
            try:
                # Validate EPUB file structure and safety
                with local_epub_path(updated_book.epub_file) as epub_path:
                    if not epub_path:
                        raise ValueError("EPUB file not found")

                    is_valid, error_message = validate_epub_file_complete(epub_path)

                    if not is_valid:
                        logger.warning(
                            f"Invalid EPUB file uploaded for book {pk} by user {user.username}: {error_message}"
                        )
                        return Response(
                            {"error": f"Invalid EPUB file: {error_message}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # Parse new EPUB file
                    epub_data = parse_epub_file(epub_path)

                # Update book with parsed data
                updated_book.table_of_contents = epub_data.get("table_of_contents", [])

                # Update content preview
                if not updated_book.content:
                    updated_book.content = epub_data.get("full_text", "")[:1000]

                updated_book.save()

                logger.info(
                    f"Successfully updated EPUB file for book '{updated_book.title}' (ID: {updated_book.id})"
                )

            except Exception as e:
                logger.error(f"Error processing EPUB file: {e}")
                return Response(
                    {"error": f"Failed to process EPUB file: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Handle hashtags
        hashtag_names = request.data.getlist("hashtags")
        if hashtag_names:
            hashtag_objs = []
            for name in hashtag_names:
                name = name.strip().lstrip("#").lower()
                if name:
                    obj, _ = Hashtag.objects.get_or_create(name=name)
                    hashtag_objs.append(obj)
            updated_book.hashtags.set(hashtag_objs)
        elif "hashtags" in request.data:
            updated_book.hashtags.clear()

        return Response(BookSerializer(updated_book).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_book(request, pk):
    book = get_object_or_404(Book, id=pk)
    user = request.user
    if book.author != user:
        return Response(
            {"error": "You are not the author of this book"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Delete files from S3/MinIO before deleting the book
    if book.epub_file:
        book.epub_file.delete(save=False)
    if book.featured_image:
        book.featured_image.delete(save=False)

    book.delete()
    return Response(
        {"message": "Book deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["GET"])
def search_books_by_hashtag(request):
    tag_name = request.query_params.get("tag", "").strip().lstrip("#").lower()
    if not tag_name:
        return Response(
            {"error": "Parameter 'tag' is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user if request.user.is_authenticated else None
    books = Book.objects.filter(hashtags__name=tag_name)

    if user:
        user_group_ids = UserToReadingGroupState.objects.filter(
            user=user, in_reading_group=True
        ).values_list("reading_group_id", flat=True)

        books = books.filter(
            models.Q(visibility="public")
            | models.Q(visibility="personal", author=user)
            | models.Q(visibility="group", reading_group_id__in=user_group_ids)
        )
    else:
        books = books.filter(visibility="public")

    books = books.select_related("author", "reading_group").prefetch_related("hashtags").distinct()

    amount = int(request.query_params.get("amount", 9))
    paginator = AnyListPagination(amount=amount)
    paginated_books = paginator.paginate_queryset(books, request)
    serializer = BookSerializerInfo(paginated_books, many=True)
    return paginator.get_paginated_response(serializer.data)
