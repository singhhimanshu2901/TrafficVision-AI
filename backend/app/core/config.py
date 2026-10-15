import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "TrafficVision AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    UPLOAD_DIR: str = str(BASE_DIR / "storage" / "uploads")
    PROCESSED_DIR: str = str(BASE_DIR / "storage" / "processed")
    EXPORTS_DIR: str = str(BASE_DIR / "storage" / "exports")
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/storage/trafficvision.db"

    # Computer Vision & Inference Defaults
    MODEL_PATH: str = str(BASE_DIR / "models" / "yolov8n.pt")
    MODEL_DEVICE: str = "cpu"
    CONFIDENCE_THRESHOLD: float = 0.35
    INFERENCE_IMAGE_SIZE: int = 416
    MAX_STREAM_FPS: int = 15
    MAX_UPLOAD_MB: int = 250
    SESSION_RETENTION_DAYS: int = 7

    # ByteTrack parameters
    BYTE_TRACK_MATCH_THRESH: float = 0.8
    BYTE_TRACK_TRACK_BUFFER: int = 30
    FRAME_RATE: int = 30

settings = Settings()

# Ensure directories exist
for folder in [settings.STORAGE_DIR, settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.EXPORTS_DIR, str(settings.BASE_DIR / "models")]:
    os.makedirs(folder, exist_ok=True)
