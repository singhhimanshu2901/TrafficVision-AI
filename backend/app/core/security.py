import re
from pathlib import Path
from fastapi import HTTPException, status

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

def sanitize_filename(filename: str) -> str:
    """Strip dangerous characters and prevent path traversal."""
    cleaned = re.sub(r"[^\w\.-]", "_", filename)
    cleaned = re.sub(r"\.\.+", ".", cleaned)
    return cleaned

def validate_video_extension(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video extension: '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext

def redact_credentials(url: str) -> str:
    """Mask credentials in RTSP or HTTP URLs for safe logging."""
    return re.sub(r"://([^:@]+):([^@]+)@", r"://\1:****@", url)
