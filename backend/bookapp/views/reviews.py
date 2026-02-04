"""
Book reviews management views.

Handles review listing and creation for books.
"""

import logging
from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Book, BookReview
from ..serializers import BookReviewSerializer

logger = logging.getLogger(__name__)


@api_view(["GET"])
def get_book_reviews(request, slug):
    """Return all reviews for a book."""
    book = get_object_or_404(Book, slug=slug)
    reviews = BookReview.objects.filter(book=book).select_related("user", "book")
    serializer = BookReviewSerializer(reviews, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_book_review(request, slug):
    """Create a review for a book."""
    book = get_object_or_404(Book, slug=slug)
    data = request.data.copy()
    if "description" not in data or data.get("description") is None:
        data["description"] = ""
    serializer = BookReviewSerializer(data=data)

    if serializer.is_valid():
        serializer.save(
            user=request.user,
            book=book,
            creation_date=date.today(),
            likes=[],
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
