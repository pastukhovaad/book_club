"""
EPUB file handling utilities for parsing and extracting content from EPUB books.
"""

import logging
from typing import Dict, List, Optional, Tuple
from ebooklib import epub
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class EPUBHandler:
    """Handler for EPUB file parsing and content extraction."""

    def __init__(self, epub_file_path: str):
        """
        Initialize EPUB handler with file path.

        Args:
            epub_file_path: Path to the EPUB file
        """
        self.epub_file_path = epub_file_path
        self.book = None
        self._load_book()

    def _load_book(self):
        """Load the EPUB file."""
        try:
            self.book = epub.read_epub(self.epub_file_path)
        except Exception as e:
            logger.error(f"Error loading EPUB file: {e}")
            raise ValueError(f"Invalid EPUB file: {e}")

    def validate_epub(self) -> Tuple[bool, Optional[str]]:
        """
        Validate EPUB file structure.

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            if not self.book:
                return False, "Failed to load EPUB file"

            # Check for required metadata
            if not self.book.get_metadata('DC', 'title'):
                return False, "Missing title metadata"

            # Check if book has content
            items = list(self.book.get_items())
            if not items:
                return False, "EPUB file has no content"

            return True, None
        except Exception as e:
            return False, str(e)

    def get_metadata(self) -> Dict:
        """
        Extract metadata from EPUB file.

        Returns:
            Dictionary containing book metadata
        """
        metadata = {}

        try:
            # Get title
            title = self.book.get_metadata('DC', 'title')
            metadata['title'] = title[0][0] if title else 'Unknown'

            # Get author
            author = self.book.get_metadata('DC', 'creator')
            metadata['author'] = author[0][0] if author else 'Unknown'

            # Get language
            language = self.book.get_metadata('DC', 'language')
            metadata['language'] = language[0][0] if language else 'en'

            # Get description
            description = self.book.get_metadata('DC', 'description')
            metadata['description'] = description[0][0] if description else ''

            # Get publisher
            publisher = self.book.get_metadata('DC', 'publisher')
            metadata['publisher'] = publisher[0][0] if publisher else ''

        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")

        return metadata

    def get_chapters(self) -> List[Dict]:
        """
        Extract chapters from EPUB file.

        Returns:
            List of dictionaries containing chapter information
        """
        chapters = []

        try:
            items = list(self.book.get_items_of_type(epub.ITEM_DOCUMENT))

            for idx, item in enumerate(items):
                content_html = item.get_content().decode('utf-8')
                text_content = self._html_to_text(content_html)

                # Try to extract chapter title from content
                soup = BeautifulSoup(content_html, 'html.parser')
                title_tag = soup.find(['h1', 'h2', 'title'])
                chapter_title = title_tag.get_text().strip() if title_tag else f"Chapter {idx + 1}"

                chapters.append({
                    'id': idx,
                    'title': chapter_title,
                    'content': text_content,
                    'html_content': content_html,
                    'file_name': item.get_name()
                })

        except Exception as e:
            logger.error(f"Error extracting chapters: {e}")

        return chapters

    def get_table_of_contents(self) -> List[Dict]:
        """
        Extract table of contents from EPUB file.

        Returns:
            List of dictionaries containing TOC structure
        """
        toc = []

        try:
            # Get TOC from EPUB
            book_toc = self.book.toc

            if isinstance(book_toc, list):
                toc = self._parse_toc_items(book_toc)
            else:
                # Fallback: generate TOC from chapters
                chapters = self.get_chapters()
                toc = [
                    {
                        'id': ch['id'],
                        'title': ch['title'],
                        'level': 0
                    }
                    for ch in chapters
                ]

        except Exception as e:
            logger.error(f"Error extracting table of contents: {e}")

        return toc

    def _parse_toc_items(self, items: List, level: int = 0) -> List[Dict]:
        """
        Recursively parse TOC items.

        Args:
            items: List of TOC items
            level: Current nesting level

        Returns:
            List of parsed TOC entries
        """
        toc_entries = []

        for idx, item in enumerate(items):
            if isinstance(item, tuple):
                # Item is a section with nested items
                section, nested_items = item
                entry = {
                    'id': f"{level}-{idx}",
                    'title': getattr(section, 'title', 'Section'),
                    'level': level,
                    'href': getattr(section, 'href', '')
                }
                toc_entries.append(entry)

                # Recursively parse nested items
                if nested_items:
                    toc_entries.extend(self._parse_toc_items(nested_items, level + 1))
            else:
                # Simple item
                entry = {
                    'id': f"{level}-{idx}",
                    'title': getattr(item, 'title', f'Item {idx}'),
                    'level': level,
                    'href': getattr(item, 'href', '')
                }
                toc_entries.append(entry)

        return toc_entries

    def get_full_text(self) -> str:
        """
        Extract all text content from EPUB file.

        Returns:
            Full text content of the book
        """
        full_text = []

        try:
            chapters = self.get_chapters()
            for chapter in chapters:
                full_text.append(chapter['content'])

        except Exception as e:
            logger.error(f"Error extracting full text: {e}")

        return '\n\n'.join(full_text)

    def get_chapter_by_id(self, chapter_id: int) -> Optional[Dict]:
        """
        Get specific chapter by ID.

        Args:
            chapter_id: Chapter identifier

        Returns:
            Chapter dictionary or None if not found
        """
        try:
            chapters = self.get_chapters()
            for chapter in chapters:
                if chapter['id'] == chapter_id:
                    return chapter
        except Exception as e:
            logger.error(f"Error getting chapter {chapter_id}: {e}")

        return None

    def _html_to_text(self, html_content: str) -> str:
        """
        Convert HTML content to plain text.

        Args:
            html_content: HTML string

        Returns:
            Plain text content
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Remove script and style elements
            for script in soup(['script', 'style']):
                script.decompose()

            # Get text
            text = soup.get_text()

            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)

            return text

        except Exception as e:
            logger.error(f"Error converting HTML to text: {e}")
            return ""

    def get_images(self) -> List[Dict]:
        """
        Extract images from EPUB file.

        Returns:
            List of dictionaries containing image information
        """
        images = []

        try:
            image_items = list(self.book.get_items_of_type(epub.ITEM_IMAGE))

            for idx, item in enumerate(image_items):
                images.append({
                    'id': idx,
                    'file_name': item.get_name(),
                    'media_type': item.media_type,
                    'content': item.get_content()
                })

        except Exception as e:
            logger.error(f"Error extracting images: {e}")

        return images


def parse_epub_file(epub_file_path: str) -> Dict:
    """
    Main function to parse EPUB file and extract all relevant information.

    Args:
        epub_file_path: Path to the EPUB file

    Returns:
        Dictionary containing metadata, chapters, and TOC
    """
    try:
        handler = EPUBHandler(epub_file_path)

        # Validate
        is_valid, error_msg = handler.validate_epub()
        if not is_valid:
            raise ValueError(f"Invalid EPUB file: {error_msg}")

        # Extract information
        return {
            'metadata': handler.get_metadata(),
            'chapters': handler.get_chapters(),
            'table_of_contents': handler.get_table_of_contents(),
            'full_text': handler.get_full_text(),
            'chapter_count': len(handler.get_chapters())
        }

    except Exception as e:
        logger.error(f"Error parsing EPUB file: {e}")
        raise
