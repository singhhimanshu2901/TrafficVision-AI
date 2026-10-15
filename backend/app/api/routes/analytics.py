import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import ProcessingSession, CountingEvent

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_sessions = db.query(func.count(ProcessingSession.id)).scalar() or 0
    total_vehicles = db.query(func.sum(ProcessingSession.unique_vehicles)).scalar() or 0
    total_pedestrians = db.query(func.sum(ProcessingSession.unique_pedestrians)).scalar() or 0
    total_inbound = db.query(func.sum(ProcessingSession.inbound_count)).scalar() or 0
    total_outbound = db.query(func.sum(ProcessingSession.outbound_count)).scalar() or 0

    class_totals = {
        "car": db.query(func.sum(ProcessingSession.unique_cars)).scalar() or 0,
        "bus": db.query(func.sum(ProcessingSession.unique_buses)).scalar() or 0,
        "truck": db.query(func.sum(ProcessingSession.unique_trucks)).scalar() or 0,
        "motorcycle": db.query(func.sum(ProcessingSession.unique_motorcycles)).scalar() or 0,
        "bicycle": db.query(func.sum(ProcessingSession.unique_bicycles)).scalar() or 0,
        "pedestrian": total_pedestrians
    }

    avg_fps = db.query(func.avg(ProcessingSession.avg_fps)).scalar() or 0.0
    avg_latency = db.query(func.avg(ProcessingSession.avg_latency_ms)).scalar() or 0.0

    return {
        "total_sessions": total_sessions,
        "total_vehicles": total_vehicles,
        "total_pedestrians": total_pedestrians,
        "total_inbound": total_inbound,
        "total_outbound": total_outbound,
        "class_totals": class_totals,
        "system_avg_fps": round(avg_fps, 1),
        "system_avg_latency_ms": round(avg_latency, 1)
    }

@router.get("/sessions/{session_id}")
def get_session_analytics(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(ProcessingSession).filter(ProcessingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    events = db.query(CountingEvent).filter(CountingEvent.session_id == session_id).order_by(CountingEvent.timestamp.asc()).all()

    return {
        "session_id": sess.id,
        "source_type": sess.source_type,
        "status": sess.status,
        "start_time": sess.start_time,
        "end_time": sess.end_time,
        "total_frames": sess.total_frames_processed,
        "avg_fps": sess.avg_fps,
        "avg_latency_ms": sess.avg_latency_ms,
        "counts": {
            "vehicles": sess.unique_vehicles,
            "pedestrians": sess.unique_pedestrians,
            "car": sess.unique_cars,
            "bus": sess.unique_buses,
            "truck": sess.unique_trucks,
            "motorcycle": sess.unique_motorcycles,
            "bicycle": sess.unique_bicycles,
            "inbound": sess.inbound_count,
            "outbound": sess.outbound_count
        },
        "recent_events": [{
            "id": e.id,
            "track_id": e.track_id,
            "object_class": e.object_class,
            "direction": e.direction,
            "confidence": e.confidence,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "frame_index": e.frame_index
        } for e in events[:100]]
    }

@router.get("/sessions/{session_id}/export")
def export_session_csv(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(ProcessingSession).filter(ProcessingSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    events = db.query(CountingEvent).filter(CountingEvent.session_id == session_id).order_by(CountingEvent.timestamp.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Event ID", "Session ID", "Frame Index", "Timestamp", "Track ID", "Object Class", "Direction", "Confidence"])

    for ev in events:
        writer.writerow([
            ev.id,
            ev.session_id,
            ev.frame_index,
            ev.timestamp.isoformat() if ev.timestamp else "",
            ev.track_id,
            ev.object_class,
            ev.direction,
            ev.confidence
        ])

    csv_data = output.getvalue()
    filename = f"trafficvision_session_{session_id[:8]}_events.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
