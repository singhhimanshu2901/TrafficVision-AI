from typing import List, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class DetectedObject(BaseModel):
    track_id: Optional[int] = None
    class_name: str
    confidence: float
    bbox: BoundingBox
    center_x: float
    center_y: float

class ClassCounts(BaseModel):
    car: int = 0
    bus: int = 0
    truck: int = 0
    motorcycle: int = 0
    bicycle: int = 0
    pedestrian: int = 0
    total_vehicles: int = 0

class FrameTelemetry(BaseModel):
    session_id: str
    frame_index: int
    timestamp_ms: float
    inference_latency_ms: float
    fps: float
    current_visible: ClassCounts
    cumulative_unique: ClassCounts
    inbound_count: int = 0
    outbound_count: int = 0
    detections: List[DetectedObject] = Field(default_factory=list)
