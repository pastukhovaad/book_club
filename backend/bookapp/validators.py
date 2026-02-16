import os
import zipfile

from django.conf import settings
from django.core.exceptions import ValidationError


def validate_epub_file_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = getattr(settings, "ALLOWED_EPUB_EXTENSIONS", [".epub"])

    if ext not in valid_extensions:
        raise ValidationError(
            f'Unsupported file extension. Only {", ".join(valid_extensions)} files are allowed.'
        )


def validate_epub_file_size(value):
    max_size = getattr(settings, "MAX_EPUB_FILE_SIZE", 50 * 1024 * 1024)

    if value.size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        raise ValidationError(
            f"File size exceeds maximum allowed size of {max_size_mb}MB. "
            f"Your file is {value.size / (1024 * 1024):.2f}MB."
        )


def validate_epub_structure(file_path):
    try:
        if not zipfile.is_zipfile(file_path):
            return False, "File is not a valid EPUB archive (not a ZIP file)"

        with zipfile.ZipFile(file_path, "r") as zip_file:
            file_list = zip_file.namelist()

            if "mimetype" not in file_list:
                return False, "EPUB file is missing required 'mimetype' file"

            mimetype_content = zip_file.read("mimetype").decode("utf-8").strip()
            if mimetype_content != "application/epub+zip":
                return (
                    False,
                    f"Invalid mimetype: expected 'application/epub+zip', got '{mimetype_content}'",
                )

            if "META-INF/container.xml" not in file_list:
                return (
                    False,
                    "EPUB file is missing required 'META-INF/container.xml' file",
                )

            bad_file = zip_file.testzip()
            if bad_file:
                return False, f"Corrupted file in EPUB archive: {bad_file}"

        return True, None

    except zipfile.BadZipFile:
        return False, "File is corrupted or not a valid ZIP archive"
    except Exception as e:
        return False, f"Error validating EPUB structure: {str(e)}"


def validate_epub_content_safety(file_path):
    warnings = []

    try:
        with zipfile.ZipFile(file_path, "r") as zip_file:
            file_list = zip_file.namelist()

            for filename in file_list:
                if ".." in filename or filename.startswith("/"):
                    warnings.append(f"Suspicious file path detected: {filename}")

                suspicious_extensions = [".exe", ".bat", ".sh", ".cmd", ".ps1", ".dll"]
                ext = os.path.splitext(filename)[1].lower()
                if ext in suspicious_extensions:
                    warnings.append(f"Suspicious executable file detected: {filename}")

            if len(file_list) > 10000:
                warnings.append(
                    f"EPUB contains unusually large number of files ({len(file_list)})"
                )

            total_compressed = 0
            total_uncompressed = 0

            for info in zip_file.infolist():
                total_compressed += info.compress_size
                total_uncompressed += info.file_size

            if total_compressed > 0:
                ratio = total_uncompressed / total_compressed
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
    is_valid_structure, structure_error = validate_epub_structure(file_path)
    if not is_valid_structure:
        return False, structure_error

    is_safe, safety_warning = validate_epub_content_safety(file_path)
    if not is_safe:
        return False, f"Security check failed: {safety_warning}"

    return True, None


def validate_file_is_not_empty(value):
    if value.size == 0:
        raise ValidationError("The uploaded file is empty.")


def validate_content_type_match(content_type, content, epub_file):
    if content_type == "plaintext":
        if not content or not content.strip():
            return False, "Content is required for plain text books"
    elif content_type == "epub":
        if not epub_file:
            return False, "EPUB file is required for EPUB books"
    else:
        return False, f"Invalid content_type: {content_type}"

    return True, None


def validate_no_profanity(value):
    from .content_moderation import contains_profanity, get_profanity_error_message

    if value and contains_profanity(str(value)):
        raise ValidationError(get_profanity_error_message())
