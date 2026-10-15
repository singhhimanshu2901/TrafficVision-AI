import psutil
import time
from fastapi import APIRouter
from app.services.model_service import model_service
from app.core.config import settings

router = APIRouter(tags=["Health & System"])

_server_start_time = time.time()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "uptime_seconds": round(time.time() - _server_start_time, 1)
    }

@router.get("/system/status")
def system_status():
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    return {
        "cpu_usage_percent": cpu_percent,
        "memory_used_mb": round((mem.total - mem.available) / (1024 * 1024), 1),
        "memory_total_mb": round(mem.total / (1024 * 1024), 1),
        "memory_percent": mem.percent,
        "device": settings.MODEL_DEVICE,
        "threads": psutil.cpu_count(logical=True)
    }

@router.get("/models/status")
def model_status():
    return model_service.get_status()
