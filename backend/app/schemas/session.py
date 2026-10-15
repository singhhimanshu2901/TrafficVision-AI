from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class VirtualLineConfig(BaseModel):
    enabled: bool = True
    x1: float = 0.1
    y1: float = 0.5
    x2: float = 0.9
    y2: float = 0.5
    direction: str = "bidirectional" # inbound, outbound, bidirectional

class SessionCreateRequest(BaseModel):
    source_type: str = Field(..., description="upload, browser_webcam, local_camera, ip_camera")
    source_name: str = Field(..., description="Uploaded video filename, camera index, or RTSP url")
    confidence_threshold: Optional[float] = 0.35
    inference_size: Optional[int] = 416
    virtual_line: Optional[VirtualLineConfig] = None
    counting_mode: Optional[str] = "both" # full_frame, line_crossing, both

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_type: str
    source_name: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    total_frames_processed: int
    avg_fps: float
    avg_latency_ms: float
    unique_vehicles: int
    unique_pedestrians: int
    unique_cars: int
    unique_buses: int
    unique_trucks: int
    unique_motorcycles: int
    unique_bicycles: int
    inbound_count: int
    outbound_count: int

class SessionDetailResponse(SessionResponse):
    config_snapshot: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
