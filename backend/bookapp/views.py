import logging
import os

from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .epub_handler import EPUBHandler, parse_epub_file
from .models import (
    Book,
    BookComment,
    CustomUser,
    Notification,
    ReadingGroup,
    UserToReadingGroupState,
)
from .serializers import (
    BookCommentCreateSerializer,
    BookCommentSerializer,
    BookSerializer,
    CommentReplyCreateSerializer,
    CommentReplySerializer,
    NotificationSerializer,
    ReadingGroupSerializer,
    SimpleAuthorSerializer,
    UpdateUserProfileSerializer,
    UserInfoSerializer,
    UserRegistrationSerializer,
    UserToReadingGroupStateSerializer,
)
from .validators import validate_epub_file_complete

logger = logging.getLogger(__name__)


class AnyListPagination(PageNumberPagination):
    def __init__(self, amount):
        self.page_size = amount


# Create your views here.
@api_view(["GET"])
def book_list(request, amount):
    books = Book.objects.all()
    paginator = AnyListPagination(amount=amount)
    paginated_books = paginator.paginate_queryset(books, request)
    serializer = BookSerializer(paginated_books, many=True)
    # logger.info(f"requested URL: {request.build_absolute_uri()}")
    # logger.info(f"Pagination info: {paginator.page_size} items per page requested.")
    # logger.info(f"Pagination info: {paginator.page.number} current page number.")
    # logger.info(f"Books retrieved: {serializer.data}")
    return paginator.get_paginated_response(serializer.data)


# @api_view(['GET'])
# def book_list(request):
#     books = Book.objects.all()
#     serializer = BookSerializer(books, many=True)
#     return Response(serializer.data)


@api_view(["GET"])
def get_book(request, slug):
    book = Book.objects.get(slug=slug)
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
        if book.content_type != 'epub':
            return Response(
                {"error": "This book is not in EPUB format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not book.epub_file:
            return Response(
                {"error": "EPUB file not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Parse EPUB and get chapter
        handler = EPUBHandler(book.epub_file.path)
        chapter = handler.get_chapter_by_id(int(chapter_id))

        if not chapter:
            return Response(
                {"error": "Chapter not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "book_title": book.title,
            "book_slug": book.slug,
            "chapter": chapter,
            "total_chapters": len(handler.get_chapters())
        })

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting chapter: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def get_book_chapters_list(request, slug):
    """
    Get list of all chapters with metadata (without full content).
    """
    try:
        book = Book.objects.get(slug=slug)

        if book.content_type != 'epub':
            return Response(
                {"error": "This book is not in EPUB format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not book.epub_file:
            return Response(
                {"error": "EPUB file not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get chapters list from table of contents
        if book.table_of_contents:
            return Response({
                "book_title": book.title,
                "book_slug": book.slug,
                "chapters": book.table_of_contents
            })

        # Fallback: parse EPUB to get chapters
        handler = EPUBHandler(book.epub_file.path)
        chapters = handler.get_chapters()

        # Return only metadata, not full content
        chapters_metadata = [
            {
                'id': ch['id'],
                'title': ch['title'],
                'file_name': ch.get('file_name', '')
            }
            for ch in chapters
        ]

        return Response({
            "book_title": book.title,
            "book_slug": book.slug,
            "chapters": chapters_metadata
        })

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting chapters list: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])  # REM
def get_reading_group(request, slug):
    reading_group = ReadingGroup.objects.get(slug=slug)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["GET"])  # REM
def get_notification(request, id):
    notification = Notification.objects.get(id=id)
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)





@api_view(["GET"])
def reading_group_list(request, amount):
    reading_groups = ReadingGroup.objects.all()
    paginator = AnyListPagination(amount=amount)
    paginated_reading_groups = paginator.paginate_queryset(reading_groups, request)
    serializer = ReadingGroupSerializer(paginated_reading_groups, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
def user_to_reading_group_state_list(request, pk):

    user = request.user
    user_to_reading_group_states = UserToReadingGroupState.objects.filter(
        reading_group_id=pk, user=user
    )



    serializer = UserToReadingGroupStateSerializer(
        user_to_reading_group_states, many=True
    )
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_reading_groups(request):
    """
    Get all reading groups where the current user is a confirmed member.
    Returns only groups where in_reading_group=True.
    """
    user = request.user

    # Get all UserToReadingGroupState entries where user is confirmed member
    user_groups = UserToReadingGroupState.objects.filter(
        user=user,
        in_reading_group=True
    ).select_related('reading_group')

    # Extract the reading groups
    reading_groups = [ug.reading_group for ug in user_groups]

    serializer = ReadingGroupSerializer(reading_groups, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def notification_list(request, amount):
    user = request.user
    notifications = Notification.objects.filter(directed_to=user)
    paginator = AnyListPagination(amount=amount)
    paginated_notifications = paginator.paginate_queryset(notifications, request)
    serializer = NotificationSerializer(paginated_notifications, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["POST"])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    serializer = UpdateUserProfileSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_book(request):
    user = request.user
    serializer = BookSerializer(data=request.data)

    if serializer.is_valid():
        # Save the book first
        book = serializer.save(author=user)

        # If EPUB file was uploaded, process it
        if book.content_type == 'epub' and book.epub_file:
            try:
                # Validate EPUB file structure and safety
                is_valid, error_message = validate_epub_file_complete(book.epub_file.path)

                if not is_valid:
                    logger.warning(f"Invalid EPUB file uploaded by user {user.username}: {error_message}")
                    book.delete()
                    return Response(
                        {"error": f"Invalid EPUB file: {error_message}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Parse EPUB file
                epub_data = parse_epub_file(book.epub_file.path)

                # Update book with parsed data
                book.table_of_contents = epub_data.get('table_of_contents', [])

                # Extract full text to content field for search/preview
                if not book.content:
                    book.content = epub_data.get('full_text', '')[:1000]  # Store first 1000 chars as preview

                book.save()

                logger.info(f"Successfully processed EPUB file for book '{book.title}' (ID: {book.id})")

            except Exception as e:
                logger.error(f"Error processing EPUB file: {e}")
                # Delete the book if EPUB processing fails
                book.delete()
                return Response(
                    {"error": f"Failed to process EPUB file: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_notification(request):
    user = request.user
    directed_to_id = request.data.get("directed_to_id")  # HERE FFS
    if directed_to_id:
        directed_user = CustomUser.objects.get(id=directed_to_id)
    else:
        directed_user = None
    related_group_id = request.data.get("related_group_id")
    if related_group_id:
        related_group = ReadingGroup.objects.get(id=related_group_id)
    serializer = NotificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            related_to=user,
            directed_to=directed_user,
            related_group=related_group,
            extra_text="",
        )
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reading_group(request):
    user = request.user
    serializer = ReadingGroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=user)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_book(request, pk):
    user = request.user
    book = Book.objects.get(id=pk)
    if book.author != user:
        return Response(
            {"error": "You are not the author of this book"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = BookSerializer(book, data=request.data, partial=True)

    if serializer.is_valid():
        updated_book = serializer.save()

        # If a new EPUB file was uploaded, process it
        if 'epub_file' in request.FILES:
            try:
                # Validate EPUB file structure and safety
                is_valid, error_message = validate_epub_file_complete(updated_book.epub_file.path)

                if not is_valid:
                    logger.warning(f"Invalid EPUB file uploaded for book {pk} by user {user.username}: {error_message}")
                    return Response(
                        {"error": f"Invalid EPUB file: {error_message}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Parse new EPUB file
                epub_data = parse_epub_file(updated_book.epub_file.path)

                # Update book with parsed data
                updated_book.table_of_contents = epub_data.get('table_of_contents', [])

                # Update content preview
                if not updated_book.content:
                    updated_book.content = epub_data.get('full_text', '')[:1000]

                updated_book.save()

                logger.info(f"Successfully updated EPUB file for book '{updated_book.title}' (ID: {updated_book.id})")

            except Exception as e:
                logger.error(f"Error processing EPUB file: {e}")
                return Response(
                    {"error": f"Failed to process EPUB file: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_reading_group(request, pk):
    user = request.user
    reading_group = ReadingGroup.objects.get(id=pk)
    if reading_group.creator != user:
        return Response(
            {"error": "You are not the creator of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    serializer = ReadingGroupSerializer(reading_group, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def add_user_to_group(request, pk):
    user = request.user
    reading_group = ReadingGroup.objects.get(id=pk)
    reading_group.user.add(user, through_defaults={"in_reading_group": False})
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def confirm_user_to_group(request, pk, user_id):
    reading_group = ReadingGroup.objects.get(id=pk)
    user = CustomUser.objects.get(id=user_id)
    UserToReadingGroupState.objects.filter(
        reading_group=reading_group, user=user  # HERE
    ).update(in_reading_group=True)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def remove_user_from_group(request, pk):
    user = request.user
    reading_group = ReadingGroup.objects.get(id=pk)
    reading_group.user.remove(user)
    serializer = ReadingGroupSerializer(reading_group)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_book(request, pk):
    book = Book.objects.get(id=pk)
    user = request.user
    if book.author != user:
        return Response(
            {"error": "You are not the author of this book"},
            status=status.HTTP_403_FORBIDDEN,
        )
    book.delete()
    return Response(
        {"message": "Book deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    notification = Notification.objects.get(id=pk)
    user = request.user
    if notification.directed_to != user:
        logger.info(f"Correct user: {notification.directed_to}; Recieved user: {user}")
        return Response(
            {
                "error": f"Вы не являетесь получателем этого уведомления; {notification.directed_to}"
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # figure out why the above check does not work properly
    notification.delete()
    return Response(
        {"message": "Сообщение успешно удалено"}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_reading_group(request, pk):
    reading_group = ReadingGroup.objects.get(id=pk)
    user = request.user
    if reading_group.creator != user:
        return Response(
            {"error": "You are not the creator of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    reading_group.delete()
    return Response(
        {"message": "Group deleted successfully"}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_username(request):
    user = request.user
    username = user.username
    return Response({"username": username})


@api_view(["GET"])
def get_userinfo(request, username):
    User = get_user_model()
    user = User.objects.get(username=username)
    serializer = UserInfoSerializer(user)
    return Response(serializer.data)


@api_view(["GET"])
def get_user(request, email):
    User = get_user_model()
    try:
        existing_user = User.objects.get(email=email)
        serializer = SimpleAuthorSerializer(existing_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


# Facebook: https://www.facebook.com/sampleusername
# Instagram: https://www.instagram.com/sampleusername
# YouTube: https://www.youtube.com/user/sampleusername
# Twitter (now X): https://twitter.com/sampleusername


# Book Comments Views

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_book_comments(request, slug):
    """
    Get all comments for a book in a specific reading group or personal comments.
    Query params:
    - reading_group_id: ID of the reading group (optional)

    If reading_group_id is provided: return group comments (only for confirmed members)
    If reading_group_id is not provided: return user's personal comments
    """
    try:
        book = Book.objects.get(slug=slug)
        reading_group_id = request.query_params.get('reading_group_id')
        user = request.user

        if reading_group_id:
            # Get group comments
            try:
                reading_group = ReadingGroup.objects.get(id=reading_group_id)
            except ReadingGroup.DoesNotExist:
                return Response(
                    {"error": "Reading group not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if user is a confirmed member of the reading group
            from .models import UserToReadingGroupState
            try:
                membership = UserToReadingGroupState.objects.get(
                    user=user,
                    reading_group=reading_group
                )
                if not membership.in_reading_group:
                    return Response(
                        {"error": "You must be a confirmed member of this reading group to view comments"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except UserToReadingGroupState.DoesNotExist:
                return Response(
                    {"error": "You must be a member of this reading group to view comments"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get all root comments for this book in this reading group (exclude replies)
            comments = BookComment.objects.filter(
                book=book,
                reading_group=reading_group,
                parent_comment__isnull=True  # Only root comments
            ).select_related('user', 'book', 'reading_group')
        else:
            # Get personal comments (only for current user, exclude replies)
            comments = BookComment.objects.filter(
                book=book,
                user=user,
                reading_group__isnull=True,
                parent_comment__isnull=True  # Only root comments
            ).select_related('user', 'book')

        serializer = BookCommentSerializer(comments, many=True)

        return Response(serializer.data)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting book comments: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_book_comment(request, slug):
    """
    Create a new comment for a book.
    Expected data:
    - reading_group: ID of the reading group
    - cfi_range: EPUB CFI range
    - selected_text: The selected text
    - comment_text: The comment content
    - highlight_color: (optional) Hex color code
    """
    try:
        book = Book.objects.get(slug=slug)
        user = request.user

        # Add book to request data
        data = request.data.copy()
        data['book'] = book.id

        serializer = BookCommentCreateSerializer(
            data=data,
            context={'request': request}
        )

        if serializer.is_valid():
            # Save with the current user
            comment = serializer.save(user=user)

            # Return full comment data
            response_serializer = BookCommentSerializer(comment)

            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error creating book comment: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_book_comment(request, slug, comment_id):
    """Get a single comment by ID."""
    try:
        book = Book.objects.get(slug=slug)
        comment = BookComment.objects.select_related(
            'user', 'book', 'reading_group'
        ).get(id=comment_id, book=book)

        user = request.user

        # Check access permissions
        if comment.reading_group:
            # Group comment - check if user is a member of the reading group
            if not comment.reading_group.user.filter(id=user.id).exists():
                return Response(
                    {"error": "You must be a member of this reading group to view this comment"},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Personal comment - only the owner can view it
            if comment.user != user:
                return Response(
                    {"error": "You can only view your own personal comments"},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = BookCommentSerializer(comment)
        return Response(serializer.data)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting book comment: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_book_comment(request, slug, comment_id):
    """
    Update an existing comment.
    Only the comment author can update their comment.
    """
    try:
        book = Book.objects.get(slug=slug)
        comment = BookComment.objects.get(id=comment_id, book=book)
        user = request.user

        # Check if user is the comment author
        if comment.user != user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prepare data - only allow updating specific fields
        allowed_fields = ['comment_text', 'highlight_color']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = BookCommentSerializer(
            comment,
            data=data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating book comment: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_book_comment(request, slug, comment_id):
    """
    Delete a comment.
    For group comments: only the comment author or reading group creator can delete.
    For personal comments: only the comment author can delete.
    """
    try:
        book = Book.objects.get(slug=slug)
        comment = BookComment.objects.get(id=comment_id, book=book)
        user = request.user

        # Check if user has permission to delete
        if comment.reading_group:
            # Group comment - author or group creator can delete
            if comment.user != user and comment.reading_group.creator != user:
                return Response(
                    {"error": "You can only delete your own comments or comments in groups you created"},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Personal comment - only author can delete
            if comment.user != user:
                return Response(
                    {"error": "You can only delete your own comments"},
                    status=status.HTTP_403_FORBIDDEN
                )

        comment.delete()
        return Response(
            {"message": "Comment deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting book comment: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Comment Replies Views

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_comment_replies(request, slug, comment_id):
    """
    Get all replies for a specific comment.
    Only accessible to users who can view the parent comment.
    """
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.select_related(
            'reading_group', 'user'
        ).get(id=comment_id, book=book)

        user = request.user

        # Check access permissions based on parent comment type
        if parent_comment.reading_group:
            # Group comment - check if user is a confirmed member
            try:
                membership = UserToReadingGroupState.objects.get(
                    user=user,
                    reading_group=parent_comment.reading_group
                )
                if not membership.in_reading_group:
                    return Response(
                        {"error": "You must be a confirmed member of this reading group to view replies"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except UserToReadingGroupState.DoesNotExist:
                return Response(
                    {"error": "You must be a member of this reading group to view replies"},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Personal comment - only the owner can view replies
            if parent_comment.user != user:
                return Response(
                    {"error": "You can only view replies to your own personal comments"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Get all replies to this comment
        replies = BookComment.objects.filter(
            parent_comment=parent_comment
        ).select_related('user').order_by('created_at')

        serializer = CommentReplySerializer(replies, many=True)
        return Response(serializer.data)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting comment replies: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment_reply(request, slug, comment_id):
    """
    Create a reply to an existing comment.
    For group comments: any confirmed group member can reply.
    For personal comments: only the owner can reply.
    """
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.select_related(
            'reading_group', 'user', 'book'
        ).get(id=comment_id, book=book)

        user = request.user

        serializer = CommentReplyCreateSerializer(
            data=request.data,
            context={
                'request': request,
                'parent_comment': parent_comment
            }
        )

        if serializer.is_valid():
            # Create the reply with inherited fields from parent
            reply = BookComment.objects.create(
                book=parent_comment.book,
                reading_group=parent_comment.reading_group,
                user=user,
                parent_comment=parent_comment,
                comment_text=serializer.validated_data['comment_text'],
                # Replies don't have CFI range or selected text
                cfi_range=None,
                selected_text=None,
                highlight_color=parent_comment.highlight_color  # Inherit color from parent
            )

            response_serializer = CommentReplySerializer(reply)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error creating comment reply: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_comment_reply(request, slug, comment_id, reply_id):
    """
    Update an existing reply.
    Only the reply author can update their reply.
    """
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.get(id=comment_id, book=book)
        reply = BookComment.objects.get(
            id=reply_id,
            parent_comment=parent_comment
        )

        user = request.user

        # Check if user is the reply author
        if reply.user != user:
            return Response(
                {"error": "You can only edit your own replies"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Only allow updating comment_text
        data = {'comment_text': request.data.get('comment_text', reply.comment_text)}

        serializer = CommentReplySerializer(reply, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment or reply not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating comment reply: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_comment_reply(request, slug, comment_id, reply_id):
    """
    Delete a reply.
    For group comments: reply author or group creator can delete.
    For personal comments: only reply author can delete.
    """
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.select_related(
            'reading_group'
        ).get(id=comment_id, book=book)
        reply = BookComment.objects.get(
            id=reply_id,
            parent_comment=parent_comment
        )

        user = request.user

        # Check deletion permissions
        if parent_comment.reading_group:
            # Group comment reply - author or group creator can delete
            if reply.user != user and parent_comment.reading_group.creator != user:
                return Response(
                    {"error": "You can only delete your own replies or replies in groups you created"},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Personal comment reply - only author can delete
            if reply.user != user:
                return Response(
                    {"error": "You can only delete your own replies"},
                    status=status.HTTP_403_FORBIDDEN
                )

        reply.delete()
        return Response(
            {"message": "Reply deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

    except Book.DoesNotExist:
        return Response(
            {"error": "Book not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment or reply not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting comment reply: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
