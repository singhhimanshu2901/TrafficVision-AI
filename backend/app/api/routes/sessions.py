import uuid
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repository import SessionRepository
from app.schemas.session import SessionCreateRequest, SessionResponse, SessionDetailResponse
from app.workers.processing_worker import ProcessingWorker

router = APIRouter(prefix="/sessions", tags=["Sessions"])

# In-memory active workers
active_workers: Dict[str, ProcessingWorker] = {}

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: SessionCreateRequest, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    config_dict = request.model_dump()
    db_session = SessionRepository.create_session(
        db, session_id, request.source_type, request.source_name, config_dict
    )

    worker = ProcessingWorker(session_id, request.source_type, request.source_name, config_dict)
    active_workers[session_id] = worker
    await worker.start()

    return db_session

@router.get("", response_model=List[SessionResponse])
def list_sessions(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    return SessionRepository.list_sessions(db, limit, offset)

@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    sess = SessionRepository.get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess

@router.post("/{session_id}/pause")
async def pause_session(session_id: str):
    worker = active_workers.get(session_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Active processing worker not found for this session")
    await worker.pause()
    return {"session_id": session_id, "status": "paused"}

@router.post("/{session_id}/resume")
async def resume_session(session_id: str):
    worker = active_workers.get(session_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Active processing worker not found for this session")
    await worker.resume()
    return {"session_id": session_id, "status": "running"}

@router.post("/{session_id}/stop")
async def stop_session(session_id: str, db: Session = Depends(get_db)):
    worker = active_workers.get(session_id)
    if worker:
        await worker.stop()
        del active_workers[session_id]
    sess = SessionRepository.get_session(db, session_id)
    if sess:
        return {"session_id": session_id, "status": "stopped"}
    raise HTTPException(status_code=404, detail="Session not found")
