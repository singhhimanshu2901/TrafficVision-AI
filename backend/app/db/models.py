import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class ProcessingSession(Base):
    __tablename__ = "processing_sessions"

    id = Column(String(36), primary_key=True, index=True)
    source_type = Column(String(32), nullable=False) # upload, browser_webcam, local_camera, ip_camera
    source_name = Column(String(255), nullable=False)
    status = Column(String(32), default="created") # created, running, paused, completed, stopped, error
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    # Aggregated metrics
    total_frames_processed = Column(Integer, default=0)
    avg_fps = Column(Float, default=0.0)
    avg_latency_ms = Column(Float, default=0.0)

    # Unique track counts
    unique_vehicles = Column(Integer, default=0)
    unique_pedestrians = Column(Integer, default=0)
    unique_cars = Column(Integer, default=0)
    unique_buses = Column(Integer, default=0)
    unique_trucks = Column(Integer, default=0)
    unique_motorcycles = Column(Integer, default=0)
    unique_bicycles = Column(Integer, default=0)

    # Line crossing counts
    inbound_count = Column(Integer, default=0)
    outbound_count = Column(Integer, default=0)

    config_snapshot = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    counting_events = relationship("CountingEvent", back_populates="session", cascade="all, delete-orphan")


class VideoMetadata(Base):
    __tablename__ = "video_metadata"

    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CountingEvent(Base):
    __tablename__ = "counting_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("processing_sessions.id"), nullable=False, index=True)
    track_id = Column(Integer, nullable=False)
    object_class = Column(String(32), nullable=False)
    direction = Column(String(16), nullable=False) # inbound, outbound, unique_detected
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    frame_index = Column(Integer, default=0)

    session = relationship("ProcessingSession", back_populates="counting_events")


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(64), primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
