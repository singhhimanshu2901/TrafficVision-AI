import os
import uuid
import aiofiles
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import sanitize_filename, validate_video_extension
from app.utils.video_validation import inspect_video_file
from app.db.session import get_db
from app.db.models import VideoMetadata

router = APIRouter(prefix="/videos", tags=["Videos"])

@router.post("/upload")
async def upload_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    validate_video_extension(file.filename)

    file_id = str(uuid.uuid4())
    safe_name = sanitize_filename(file.filename)
    stored_filename = f"{file_id}_{safe_name}"
    save_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    # Write file stream with size enforcement
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    total_written = 0

    async with aiofiles.open(save_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024): # 1MB chunks
            total_written += len(chunk)
            if total_written > max_bytes:
                await out_file.close()
                if os.path.exists(save_path):
                    os.remove(save_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds {settings.MAX_UPLOAD_MB} MB limit."
                )
            await out_file.write(chunk)

    # Validate video decodability and extract dimensions
    try:
        meta = inspect_video_file(save_path)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise e

    record = VideoMetadata(
        id=file_id,
        filename=stored_filename,
        original_name=file.filename,
        file_path=save_path,
        file_size_bytes=total_written,
        duration_seconds=meta["duration_seconds"],
        fps=meta["fps"],
        width=meta["width"],
        height=meta["height"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "filename": record.filename,
        "original_name": record.original_name,
        "file_path": record.file_path,
        "size_mb": round(total_written / (1024 * 1024), 2),
        "duration_seconds": record.duration_seconds,
        "resolution": f"{record.width}x{record.height}",
        "fps": record.fps
    }

@router.get("")
def list_videos(db: Session = Depends(get_db)):
    videos = db.query(VideoMetadata).order_by(VideoMetadata.created_at.desc()).all()
    return [{
        "id": v.id,
        "filename": v.filename,
        "original_name": v.original_name,
        "file_path": v.file_path,
        "size_mb": round(v.file_size_bytes / (1024 * 1024), 2),
        "duration_seconds": v.duration_seconds,
        "fps": v.fps,
        "resolution": f"{v.width}x{v.height}",
        "created_at": v.created_at
    } for v in videos]

@router.delete("/{video_id}")
def delete_video(video_id: str, db: Session = Depends(get_db)):
    v = db.query(VideoMetadata).filter(VideoMetadata.id == video_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Video record not found")
    if os.path.exists(v.file_path):
        try:
            os.remove(v.file_path)
        except Exception:
            pass
    db.delete(v)
    db.commit()
    return {"status": "deleted", "video_id": video_id}
