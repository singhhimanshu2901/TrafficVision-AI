from pydantic import BaseModel, Field
from typing import Optional

class AppSettingsSchema(BaseModel):
    confidence_threshold: float = Field(0.35, ge=0.05, le=0.95)
    inference_image_size: int = Field(416, ge=256, le=1280)
    processing_interval_ms: int = Field(66, ge=10, le=1000)
    max_stream_fps: int = Field(15, ge=1, le=60)
    bounding_box_visible: bool = True
    confidence_label_visible: bool = True
    tracking_id_visible: bool = True
    counting_mode: str = "both"
    line_x1: float = 0.1
    line_y1: float = 0.5
    line_x2: float = 0.9
    line_y2: float = 0.5
    counting_direction: str = "bidirectional"
    max_upload_mb: int = 250
    session_retention_days: int = 7
