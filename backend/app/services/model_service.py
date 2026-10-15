import os
import time
from typing import Dict, Any, List, Tuple
from app.core.config import settings
from app.core.logging import logger

# COCO Class mapping explicitly mapped to traffic categories
# 0: person -> Pedestrian
# 1: bicycle -> Bicycle
# 2: car -> Car
# 3: motorcycle -> Motorcycle
# 5: bus -> Bus
# 7: truck -> Truck
COCO_TRAFFIC_CLASSES: Dict[int, str] = {
    0: "Pedestrian",
    1: "Bicycle",
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}

class ModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.is_loaded = False
            cls._instance.load_error = None
        return cls._instance

    def load_model(self) -> bool:
        if self.is_loaded and self.model is not None:
            return True

        try:
            from ultralytics import YOLO
            import torch

            model_path = settings.MODEL_PATH
            # Fallback path checks for local models directory
            if not os.path.exists(model_path):
                if os.path.exists("models/yolov8n.pt"):
                    model_path = "models/yolov8n.pt"
                elif os.path.exists("yolov8n.pt"):
                    model_path = "yolov8n.pt"

            logger.info(f"Loading YOLOv8n model from {model_path} onto {settings.MODEL_DEVICE}...")

            # Configure CPU threads
            if settings.MODEL_DEVICE.lower() == "cpu":
                torch.set_num_threads(max(1, min(4, os.cpu_count() or 2)))

            self.model = YOLO(model_path)
            self.model.to(settings.MODEL_DEVICE)

            # Model warm-up on dummy tensor
            import numpy as np
            dummy_img = np.zeros((settings.INFERENCE_IMAGE_SIZE, settings.INFERENCE_IMAGE_SIZE, 3), dtype=np.uint8)
            _ = self.model.predict(dummy_img, imgsz=settings.INFERENCE_IMAGE_SIZE, device=settings.MODEL_DEVICE, verbose=False)

            self.is_loaded = True
            self.load_error = None
            logger.info("YOLOv8n model initialized and warmed up successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to load YOLOv8n model: {e}")
            self.load_error = str(e)
            self.is_loaded = False
            return False

    def get_status(self) -> Dict[str, Any]:
        return {
            "model_name": "YOLOv8 Nano",
            "weights_path": settings.MODEL_PATH,
            "device": settings.MODEL_DEVICE,
            "is_loaded": self.is_loaded,
            "error": self.load_error,
            "supported_classes": list(COCO_TRAFFIC_CLASSES.values())
        }

model_service = ModelService()
