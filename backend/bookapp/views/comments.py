"""
Book comments and replies management views.

Handles comment CRUD operations, reply management, and comment access control.
"""

import logging
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import BookComment, Book, ReadingGroup, UserToReadingGroupState
from ..serializers import (
    BookCommentSerializer,
    BookCommentCreateSerializer,
    CommentReplySerializer,
    CommentReplyCreateSerializer,
)

logger = logging.getLogger(__name__)


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
        reading_group_id = request.query_params.get("reading_group_id")
        user = request.user

        if reading_group_id:
            # Get group comments
            try:
                reading_group = ReadingGroup.objects.get(id=reading_group_id)
            except ReadingGroup.DoesNotExist:
                return Response(
                    {"error": "Reading group not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check if user is a confirmed member of the reading group
            from ..models import UserToReadingGroupState

            try:
                membership = UserToReadingGroupState.objects.get(
                    user=user, reading_group=reading_group
                )
                if not membership.in_reading_group:
                    return Response(
                        {
                            "error": "You must be a confirmed member of this reading group to view comments"
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except UserToReadingGroupState.DoesNotExist:
                return Response(
                    {
                        "error": "You must be a member of this reading group to view comments"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get all root comments for this book in this reading group (exclude replies)
            comments = BookComment.objects.filter(
                book=book,
                reading_group=reading_group,
                parent_comment__isnull=True,  # Only root comments
            ).select_related("user", "book", "reading_group").annotate(
                replies_count=Count("replies")
            )
        else:
            # Get personal comments (only for current user, exclude replies)
            comments = BookComment.objects.filter(
                book=book,
                user=user,
                reading_group__isnull=True,
                parent_comment__isnull=True,  # Only root comments
            ).select_related("user", "book").annotate(
                replies_count=Count("replies")
            )

        serializer = BookCommentSerializer(comments, many=True)

        return Response(serializer.data)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting book comments: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        data["book"] = book.id

        serializer = BookCommentCreateSerializer(
            data=data, context={"request": request}
        )

        if serializer.is_valid():
            # Save with the current user
            comment = serializer.save(user=user)

            # Reload comment with replies_count annotation
            comment = BookComment.objects.select_related(
                "user", "book", "reading_group"
            ).annotate(
                replies_count=Count("replies")
            ).get(id=comment.id)

            # Return full comment data
            response_serializer = BookCommentSerializer(comment)

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating book comment: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_book_comment(request, slug, comment_id):
    """Get a single comment by ID."""
    try:
        book = Book.objects.get(slug=slug)
        comment = BookComment.objects.select_related(
            "user", "book", "reading_group"
        ).annotate(
            replies_count=Count("replies")
        ).get(id=comment_id, book=book)

        user = request.user

        # Check access permissions
        if comment.reading_group:
            # Group comment - check if user is a member of the reading group
            if not comment.reading_group.user.filter(id=user.id).exists():
                return Response(
                    {
                        "error": "You must be a member of this reading group to view this comment"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            # Personal comment - only the owner can view it
            if comment.user != user:
                return Response(
                    {"error": "You can only view your own personal comments"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = BookCommentSerializer(comment)
        return Response(serializer.data)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting book comment: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prepare data - only allow updating specific fields
        allowed_fields = ["comment_text", "highlight_color"]
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = BookCommentSerializer(comment, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()

            # Reload comment with replies_count annotation
            comment = BookComment.objects.select_related(
                "user", "book", "reading_group"
            ).annotate(
                replies_count=Count("replies")
            ).get(id=comment_id)

            return Response(BookCommentSerializer(comment).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating book comment: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                    {
                        "error": "You can only delete your own comments or comments in groups you created"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            # Personal comment - only author can delete
            if comment.user != user:
                return Response(
                    {"error": "You can only delete your own comments"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        comment.delete()
        return Response(
            {"message": "Comment deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting book comment: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            "reading_group", "user"
        ).get(id=comment_id, book=book)

        user = request.user

        # Check access permissions based on parent comment type
        if parent_comment.reading_group:
            # Group comment - check if user is a confirmed member
            try:
                membership = UserToReadingGroupState.objects.get(
                    user=user, reading_group=parent_comment.reading_group
                )
                if not membership.in_reading_group:
                    return Response(
                        {
                            "error": "You must be a confirmed member of this reading group to view replies"
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except UserToReadingGroupState.DoesNotExist:
                return Response(
                    {
                        "error": "You must be a member of this reading group to view replies"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            # Personal comment - only the owner can view replies
            if parent_comment.user != user:
                return Response(
                    {
                        "error": "You can only view replies to your own personal comments"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Get all replies to this comment
        replies = (
            BookComment.objects.filter(parent_comment=parent_comment)
            .select_related("user")
            .order_by("created_at")
        )

        serializer = CommentReplySerializer(replies, many=True)
        return Response(serializer.data)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting comment replies: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            "reading_group", "user", "book"
        ).get(id=comment_id, book=book)

        user = request.user

        serializer = CommentReplyCreateSerializer(
            data=request.data,
            context={"request": request, "parent_comment": parent_comment},
        )

        if serializer.is_valid():
            # Create the reply with inherited fields from parent
            reply = BookComment.objects.create(
                book=parent_comment.book,
                reading_group=parent_comment.reading_group,
                user=user,
                parent_comment=parent_comment,
                comment_text=serializer.validated_data["comment_text"],
                # Replies don't have CFI range or selected text
                cfi_range=None,
                selected_text=None,
                highlight_color=parent_comment.highlight_color,  # Inherit color from parent
            )

            response_serializer = CommentReplySerializer(reply)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error creating comment reply: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        reply = BookComment.objects.get(id=reply_id, parent_comment=parent_comment)

        user = request.user

        # Check if user is the reply author
        if reply.user != user:
            return Response(
                {"error": "You can only edit your own replies"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only allow updating comment_text
        data = {"comment_text": request.data.get("comment_text", reply.comment_text)}

        serializer = CommentReplySerializer(reply, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment or reply not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating comment reply: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        parent_comment = BookComment.objects.select_related("reading_group").get(
            id=comment_id, book=book
        )
        reply = BookComment.objects.get(id=reply_id, parent_comment=parent_comment)

        user = request.user

        # Check deletion permissions
        if parent_comment.reading_group:
            # Group comment reply - author or group creator can delete
            if reply.user != user and parent_comment.reading_group.creator != user:
                return Response(
                    {
                        "error": "You can only delete your own replies or replies in groups you created"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            # Personal comment reply - only author can delete
            if reply.user != user:
                return Response(
                    {"error": "You can only delete your own replies"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        reply.delete()
        return Response(
            {"message": "Reply deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )

    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
    except BookComment.DoesNotExist:
        return Response(
            {"error": "Comment or reply not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting comment reply: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
