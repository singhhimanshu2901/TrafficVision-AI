import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import ProcessingSession, VideoMetadata, CountingEvent, AppSetting

class SessionRepository:
    @staticmethod
    def create_session(db: Session, session_id: str, source_type: str, source_name: str, config: Dict[str, Any]) -> ProcessingSession:
        session = ProcessingSession(
            id=session_id,
            source_type=source_type,
            source_name=source_name,
            status="running",
            config_snapshot=config,
            start_time=datetime.datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session(db: Session, session_id: str) -> Optional[ProcessingSession]:
        return db.query(ProcessingSession).filter(ProcessingSession.id == session_id).first()

    @staticmethod
    def list_sessions(db: Session, limit: int = 50, offset: int = 0) -> List[ProcessingSession]:
        return db.query(ProcessingSession).order_by(ProcessingSession.start_time.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def update_session_metrics(
        db: Session,
        session_id: str,
        frames_processed: int,
        avg_fps: float,
        avg_latency: float,
        unique_counts: Dict[str, int],
        inbound: int,
        outbound: int,
        status: Optional[str] = None
    ) -> Optional[ProcessingSession]:
        session = db.query(ProcessingSession).filter(ProcessingSession.id == session_id).first()
        if not session:
            return None
        session.total_frames_processed = frames_processed
        session.avg_fps = round(avg_fps, 2)
        session.avg_latency_ms = round(avg_latency, 2)
        session.unique_vehicles = unique_counts.get("vehicles", 0)
        session.unique_pedestrians = unique_counts.get("pedestrians", 0)
        session.unique_cars = unique_counts.get("car", 0)
        session.unique_buses = unique_counts.get("bus", 0)
        session.unique_trucks = unique_counts.get("truck", 0)
        session.unique_motorcycles = unique_counts.get("motorcycle", 0)
        session.unique_bicycles = unique_counts.get("bicycle", 0)
        session.inbound_count = inbound
        session.outbound_count = outbound
        if status:
            session.status = status
            if status in ["completed", "stopped", "error"]:
                session.end_time = datetime.datetime.utcnow()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def add_counting_event(db: Session, session_id: str, track_id: int, obj_class: str, direction: str, confidence: float, frame_idx: int):
        event = CountingEvent(
            session_id=session_id,
            track_id=track_id,
            object_class=obj_class,
            direction=direction,
            confidence=round(confidence, 3),
            frame_index=frame_idx,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(event)
        db.commit()
