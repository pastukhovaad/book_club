import logging
from typing import Dict, List, Optional, Tuple

from bs4 import BeautifulSoup
from ebooklib import epub

logger = logging.getLogger(__name__)


class EPUBHandler:
    def __init__(self, epub_file_path: str):
        self.epub_file_path = epub_file_path
        self.book = None
        self._chapters = None
        self._toc = None
        self._load_book()

    def _load_book(self):
        try:
            self.book = epub.read_epub(self.epub_file_path)
        except Exception as e:
            logger.error(f"Error loading EPUB file: {e}")
            raise ValueError(f"Invalid EPUB file: {e}")

    def validate_epub(self) -> Tuple[bool, Optional[str]]:
        try:
            if not self.book:
                return False, "Failed to load EPUB file"

            if not self.book.get_metadata("DC", "title"):
                return False, "Missing title metadata"

            items = list(self.book.get_items())
            if not items:
                return False, "EPUB file has no content"

            return True, None
        except Exception as e:
            return False, str(e)

    def get_metadata(self) -> Dict:
        metadata = {}

        try:
            title = self.book.get_metadata("DC", "title")
            metadata["title"] = title[0][0] if title else "Unknown"

            author = self.book.get_metadata("DC", "creator")
            metadata["author"] = author[0][0] if author else "Unknown"

            language = self.book.get_metadata("DC", "language")
            metadata["language"] = language[0][0] if language else "en"

            description = self.book.get_metadata("DC", "description")
            metadata["description"] = description[0][0] if description else ""

            publisher = self.book.get_metadata("DC", "publisher")
            metadata["publisher"] = publisher[0][0] if publisher else ""

        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")

        return metadata

    def get_chapters(self) -> List[Dict]:
        if self._chapters is not None:
            return self._chapters

        chapters = []

        try:
            items = list(self.book.get_items_of_type(epub.ITEM_DOCUMENT))

            for idx, item in enumerate(items):
                content_html = item.get_content().decode("utf-8")
                text_content = self._html_to_text(content_html)

                soup = BeautifulSoup(content_html, "html.parser")
                title_tag = soup.find(["h1", "h2", "title"])
                chapter_title = (
                    title_tag.get_text().strip() if title_tag else f"Chapter {idx + 1}"
                )

                chapters.append(
                    {
                        "id": idx,
                        "title": chapter_title,
                        "content": text_content,
                        "html_content": content_html,
                        "file_name": item.get_name(),
                    }
                )

        except Exception as e:
            logger.error(f"Error extracting chapters: {e}")

        self._chapters = chapters
        return chapters

    def get_table_of_contents(self) -> List[Dict]:
        if self._toc is not None:
            return self._toc

        toc = []

        try:
            book_toc = self.book.toc

            if isinstance(book_toc, list):
                toc = self._parse_toc_items(book_toc)
            else:
                chapters = self.get_chapters()
                toc = [
                    {"id": ch["id"], "title": ch["title"], "level": 0}
                    for ch in chapters
                ]

        except Exception as e:
            logger.error(f"Error extracting table of contents: {e}")

        self._toc = toc
        return toc

    def _parse_toc_items(self, items: List, level: int = 0) -> List[Dict]:
        toc_entries = []

        for idx, item in enumerate(items):
            if isinstance(item, tuple):
                section, nested_items = item
                entry = {
                    "id": f"{level}-{idx}",
                    "title": getattr(section, "title", "Section"),
                    "level": level,
                    "href": getattr(section, "href", ""),
                }
                toc_entries.append(entry)

                if nested_items:
                    toc_entries.extend(self._parse_toc_items(nested_items, level + 1))
            else:
                entry = {
                    "id": f"{level}-{idx}",
                    "title": getattr(item, "title", f"Item {idx}"),
                    "level": level,
                    "href": getattr(item, "href", ""),
                }
                toc_entries.append(entry)

        return toc_entries

    def get_full_text(self) -> str:
        full_text = []

        try:
            chapters = self.get_chapters()
            for chapter in chapters:
                full_text.append(chapter["content"])

        except Exception as e:
            logger.error(f"Error extracting full text: {e}")

        return "\n\n".join(full_text)

    def get_chapter_by_id(self, chapter_id: int) -> Optional[Dict]:
        try:
            chapters = self.get_chapters()
            for chapter in chapters:
                if chapter["id"] == chapter_id:
                    return chapter
        except Exception as e:
            logger.error(f"Error getting chapter {chapter_id}: {e}")

        return None

    def _html_to_text(self, html_content: str) -> str:
        try:
            soup = BeautifulSoup(html_content, "html.parser")

            for script in soup(["script", "style"]):
                script.decompose()

            text = soup.get_text()

            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = "\n".join(chunk for chunk in chunks if chunk)

            return text

        except Exception as e:
            logger.error(f"Error converting HTML to text: {e}")
            return ""

    def get_images(self) -> List[Dict]:
        images = []

        try:
            image_items = list(self.book.get_items_of_type(epub.ITEM_IMAGE))

            for idx, item in enumerate(image_items):
                images.append(
                    {
                        "id": idx,
                        "file_name": item.get_name(),
                        "media_type": item.media_type,
                        "content": item.get_content(),
                    }
                )

        except Exception as e:
            logger.error(f"Error extracting images: {e}")

        return images


def parse_epub_file(epub_file_path: str) -> Dict:
    try:
        handler = EPUBHandler(epub_file_path)

        is_valid, error_msg = handler.validate_epub()
        if not is_valid:
            raise ValueError(f"Invalid EPUB file: {error_msg}")

        chapters = handler.get_chapters()

        full_text = "\n\n".join(chapter["content"] for chapter in chapters)

        return {
            "metadata": handler.get_metadata(),
            "chapters": chapters,
            "table_of_contents": handler.get_table_of_contents(),
            "full_text": full_text,
            "chapter_count": len(chapters),
        }

    except Exception as e:
        logger.error(f"Error parsing EPUB file: {e}")
        raise
