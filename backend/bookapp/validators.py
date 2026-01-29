"""
Validators for book content, including EPUB file validation.
"""

import os
import zipfile
from django.core.exceptions import ValidationError
from django.conf import settings


def validate_epub_file_extension(value):
    """
    Validate that the uploaded file has a .epub extension.
    """
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = getattr(settings, 'ALLOWED_EPUB_EXTENSIONS', ['.epub'])

    if ext not in valid_extensions:
        raise ValidationError(
            f'Unsupported file extension. Only {", ".join(valid_extensions)} files are allowed.'
        )


def validate_epub_file_size(value):
    """
    Validate that the uploaded file does not exceed the maximum allowed size.
    """
    max_size = getattr(settings, 'MAX_EPUB_FILE_SIZE', 50 * 1024 * 1024)  # Default 50MB

    if value.size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        raise ValidationError(
            f'File size exceeds maximum allowed size of {max_size_mb}MB. '
            f'Your file is {value.size / (1024 * 1024):.2f}MB.'
        )


def validate_epub_structure(file_path):
    """
    Validate that the EPUB file has the correct structure.

    An EPUB file is essentially a ZIP archive with specific required files:
    - mimetype file (must be first in the archive)
    - META-INF/container.xml

    Args:
        file_path: Path to the EPUB file

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check if file is a valid ZIP archive
        if not zipfile.is_zipfile(file_path):
            return False, "File is not a valid EPUB archive (not a ZIP file)"

        with zipfile.ZipFile(file_path, 'r') as zip_file:
            # Get list of files in the archive
            file_list = zip_file.namelist()

            # Check for required mimetype file
            if 'mimetype' not in file_list:
                return False, "EPUB file is missing required 'mimetype' file"

            # Read and validate mimetype
            mimetype_content = zip_file.read('mimetype').decode('utf-8').strip()
            if mimetype_content != 'application/epub+zip':
                return False, f"Invalid mimetype: expected 'application/epub+zip', got '{mimetype_content}'"

            # Check for META-INF/container.xml
            if 'META-INF/container.xml' not in file_list:
                return False, "EPUB file is missing required 'META-INF/container.xml' file"

            # Verify ZIP file integrity
            bad_file = zip_file.testzip()
            if bad_file:
                return False, f"Corrupted file in EPUB archive: {bad_file}"

        return True, None

    except zipfile.BadZipFile:
        return False, "File is corrupted or not a valid ZIP archive"
    except Exception as e:
        return False, f"Error validating EPUB structure: {str(e)}"


def validate_epub_content_safety(file_path):
    """
    Perform basic safety checks on EPUB content.

    Args:
        file_path: Path to the EPUB file

    Returns:
        Tuple of (is_safe, warning_message)
    """
    warnings = []

    try:
        with zipfile.ZipFile(file_path, 'r') as zip_file:
            file_list = zip_file.namelist()

            # Check for suspicious file paths (path traversal attempts)
            for filename in file_list:
                # Check for path traversal patterns
                if '..' in filename or filename.startswith('/'):
                    warnings.append(f"Suspicious file path detected: {filename}")

                # Check for executable files (shouldn't be in EPUB)
                suspicious_extensions = ['.exe', '.bat', '.sh', '.cmd', '.ps1', '.dll']
                ext = os.path.splitext(filename)[1].lower()
                if ext in suspicious_extensions:
                    warnings.append(f"Suspicious executable file detected: {filename}")

            # Check for excessively large number of files (possible zip bomb)
            if len(file_list) > 10000:
                warnings.append(f"EPUB contains unusually large number of files ({len(file_list)})")

            # Check uncompressed size vs compressed size ratio
            total_compressed = 0
            total_uncompressed = 0

            for info in zip_file.infolist():
                total_compressed += info.compress_size
                total_uncompressed += info.file_size

            if total_compressed > 0:
                ratio = total_uncompressed / total_compressed
                # If uncompressed is more than 100x compressed, it might be a zip bomb
                if ratio > 100:
                    warnings.append(
                        f"Suspicious compression ratio ({ratio:.1f}:1). "
                        "File may be a zip bomb."
                    )

        if warnings:
            return False, "; ".join(warnings)

        return True, None

    except Exception as e:
        return False, f"Error checking EPUB safety: {str(e)}"


def validate_epub_file_complete(file_path):
    """
    Perform complete validation of an EPUB file.

    Combines structure validation and safety checks.

    Args:
        file_path: Path to the EPUB file

    Returns:
        Tuple of (is_valid, error_message)
    """
    # First check structure
    is_valid_structure, structure_error = validate_epub_structure(file_path)
    if not is_valid_structure:
        return False, structure_error

    # Then check safety
    is_safe, safety_warning = validate_epub_content_safety(file_path)
    if not is_safe:
        return False, f"Security check failed: {safety_warning}"

    return True, None


def validate_file_is_not_empty(value):
    """
    Validate that the uploaded file is not empty.
    """
    if value.size == 0:
        raise ValidationError('The uploaded file is empty.')


def validate_content_type_match(content_type, content, epub_file):
    """
    Validate that content matches the specified content_type.

    Args:
        content_type: Either 'plaintext' or 'epub'
        content: Text content (for plaintext books)
        epub_file: Uploaded EPUB file (for epub books)

    Returns:
        Tuple of (is_valid, error_message)
    """
    if content_type == 'plaintext':
        if not content or not content.strip():
            return False, "Content is required for plain text books"
    elif content_type == 'epub':
        if not epub_file:
            return False, "EPUB file is required for EPUB books"
    else:
        return False, f"Invalid content_type: {content_type}"

    return True, None
