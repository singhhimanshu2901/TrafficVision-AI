import cv2
from typing import List, Dict
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from app.core.security import redact_credentials

router = APIRouter(prefix="/cameras", tags=["Cameras"])

class CameraTestRequest(BaseModel):
    source: str = Field(..., description="Camera index (e.g. '0') or RTSP/HTTP stream URL")

@router.get("")
def list_available_cameras():
    """Probes local camera indices safely (0 through 2)"""
    available = []
    for idx in range(3):
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                available.append({
                    "id": str(idx),
                    "name": f"Local Camera Index #{idx}",
                    "type": "local",
                    "accessible": True
                })
            cap.release()
    return available

@router.post("/test")
def test_camera_connection(req: CameraTestRequest):
    source_val = int(req.source) if req.source.isdigit() else req.source
    cap = cv2.VideoCapture(source_val)

    if not cap.isOpened():
        safe_url = redact_credentials(req.source)
        return {
            "success": False,
            "source": safe_url,
            "message": "Failed to connect to camera source or stream is inaccessible."
        }

    ret, frame = cap.read()
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.release()

    if not ret or frame is None:
        return {
            "success": False,
            "source": redact_credentials(req.source),
            "message": "Connected but failed to capture test frame."
        }

    return {
        "success": True,
        "source": redact_credentials(req.source),
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "message": f"Camera feed verified: {width}x{height} @ {fps:.1f} FPS"
    }
