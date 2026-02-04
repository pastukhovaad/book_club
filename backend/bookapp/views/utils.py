"""
Shared utilities for views module.

Contains helper functions and classes used across multiple view modules.
"""

import os
import tempfile
from contextlib import contextmanager

from rest_framework.pagination import PageNumberPagination


@contextmanager
def local_epub_path(epub_field_file):
    """
    Context manager for EPUB file path resolution.

    Handles both local filesystem and remote storage (S3/MinIO) by creating
    a temporary local copy when needed.

    Args:
        epub_field_file: Django FileField instance pointing to an EPUB file

    Yields:
        str: Path to the EPUB file (local or temporary)

    Usage:
        with local_epub_path(book.epub_file) as path:
            # Use the path for EPUB processing
            process_epub(path)
    """
    if not epub_field_file:
        yield None
        return

    try:
        yield epub_field_file.path
        return
    except Exception:
        pass

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".epub")
    temp_path = temp_file.name
    temp_file.close()

    try:
        with epub_field_file.open("rb") as source, open(temp_path, "wb") as dest:
            for chunk in iter(lambda: source.read(8192), b""):
                if not chunk:
                    break
                dest.write(chunk)
        yield temp_path
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


class AnyListPagination(PageNumberPagination):
    """
    Custom pagination class with configurable page size.
    Enforces a maximum limit of 100 items per page to prevent abuse.

    Usage:
        paginator = AnyListPagination(amount=50)
        paginated_results = paginator.paginate_queryset(queryset, request)
    """
    max_page_size = 100  # Maximum items per page

    def __init__(self, amount):
        # Enforce maximum page size limit
        self.page_size = min(int(amount), self.max_page_size)
        super().__init__()
