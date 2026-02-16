import logging

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Book, BookComment, ReadingGroup, UserToReadingGroupState
from ..serializers import (
    BookCommentCreateSerializer,
    BookCommentSerializer,
    CommentReplyCreateSerializer,
    CommentReplySerializer,
)

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_book_comments(request, slug):
    try:
        book = Book.objects.get(slug=slug)
        reading_group_id = request.query_params.get("reading_group_id")
        user = request.user

        if reading_group_id:
            try:
                reading_group = ReadingGroup.objects.get(id=reading_group_id)
            except ReadingGroup.DoesNotExist:
                return Response(
                    {"error": "Reading group not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

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

            comments = (
                BookComment.objects.filter(
                    book=book,
                    reading_group=reading_group,
                    parent_comment__isnull=True,
                )
                .select_related("user", "book", "reading_group")
                .annotate(replies_count=Count("replies"))
            )
        else:
            comments = (
                BookComment.objects.filter(
                    book=book,
                    user=user,
                    reading_group__isnull=True,
                    parent_comment__isnull=True,
                )
                .select_related("user", "book")
                .annotate(replies_count=Count("replies"))
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
    try:
        book = Book.objects.get(slug=slug)
        user = request.user

        data = request.data.copy()
        data["book"] = book.id

        serializer = BookCommentCreateSerializer(
            data=data, context={"request": request}
        )

        if serializer.is_valid():
            comment = serializer.save(user=user)

            comment = (
                BookComment.objects.select_related("user", "book", "reading_group")
                .annotate(replies_count=Count("replies"))
                .get(id=comment.id)
            )

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
    try:
        book = Book.objects.get(slug=slug)
        comment = (
            BookComment.objects.select_related("user", "book", "reading_group")
            .annotate(replies_count=Count("replies"))
            .get(id=comment_id, book=book)
        )

        user = request.user

        if comment.reading_group:
            if not comment.reading_group.user.filter(id=user.id).exists():
                return Response(
                    {
                        "error": "You must be a member of this reading group to view this comment"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
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
    try:
        book = Book.objects.get(slug=slug)
        comment = BookComment.objects.get(id=comment_id, book=book)
        user = request.user

        if comment.user != user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = ["comment_text", "highlight_color"]
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = BookCommentSerializer(comment, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()

            comment = (
                BookComment.objects.select_related("user", "book", "reading_group")
                .annotate(replies_count=Count("replies"))
                .get(id=comment_id)
            )

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
    try:
        book = Book.objects.get(slug=slug)
        comment = BookComment.objects.get(id=comment_id, book=book)
        user = request.user

        if comment.reading_group:
            if comment.user != user and comment.reading_group.creator != user:
                return Response(
                    {
                        "error": "You can only delete your own comments or comments in groups you created"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_comment_replies(request, slug, comment_id):
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.select_related(
            "reading_group", "user"
        ).get(id=comment_id, book=book)

        user = request.user

        if parent_comment.reading_group:
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
            if parent_comment.user != user:
                return Response(
                    {
                        "error": "You can only view replies to your own personal comments"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

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
            reply = BookComment.objects.create(
                book=parent_comment.book,
                reading_group=parent_comment.reading_group,
                user=user,
                parent_comment=parent_comment,
                comment_text=serializer.validated_data["comment_text"],
                cfi_range=None,
                selected_text=None,
                highlight_color=parent_comment.highlight_color,
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
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.get(id=comment_id, book=book)
        reply = BookComment.objects.get(id=reply_id, parent_comment=parent_comment)

        user = request.user

        if reply.user != user:
            return Response(
                {"error": "You can only edit your own replies"},
                status=status.HTTP_403_FORBIDDEN,
            )

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
    try:
        book = Book.objects.get(slug=slug)
        parent_comment = BookComment.objects.select_related("reading_group").get(
            id=comment_id, book=book
        )
        reply = BookComment.objects.get(id=reply_id, parent_comment=parent_comment)

        user = request.user

        if parent_comment.reading_group:
            if reply.user != user and parent_comment.reading_group.creator != user:
                return Response(
                    {
                        "error": "You can only delete your own replies or replies in groups you created"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
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
