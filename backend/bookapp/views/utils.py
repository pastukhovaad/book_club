import os
import tempfile
from contextlib import contextmanager

from rest_framework.pagination import PageNumberPagination


@contextmanager
def local_epub_path(epub_field_file):
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
    max_page_size = 100

    def __init__(self, amount):
        self.page_size = min(int(amount), self.max_page_size)
        super().__init__()
