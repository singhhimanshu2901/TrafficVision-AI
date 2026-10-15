import time
import numpy as np
from typing import List, Dict, Any, Tuple
from app.services.model_service import model_service, COCO_TRAFFIC_CLASSES
from app.core.config import settings
from app.core.logging import logger

class DetectionService:
    def __init__(self):
        pass

    def reset_tracker(self):
        """Resets tracker states when a new session starts or source is switched."""
        try:
            if model_service.model is not None and hasattr(model_service.model, 'predictor'):
                if hasattr(model_service.model.predictor, 'trackers'):
                    model_service.model.predictor.trackers = []
        except Exception as e:
            logger.warning(f"Tracker reset warning: {e}")

    def run_detection_and_tracking(
        self,
        frame: np.ndarray,
        conf_threshold: float = 0.35,
        imgsz: int = 416
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Runs YOLOv8 Nano detection with ByteTrack tracking.
        Returns:
            - List of detections with tracking IDs
            - Inference duration in milliseconds
        """
        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
            return [], 0.0

        if not model_service.is_loaded:
            model_service.load_model()

        if not model_service.is_loaded or model_service.model is None:
            return [], 0.0

        t0 = time.perf_counter()
        orig_h, orig_w = frame.shape[:2]
        conf_clamped = max(0.05, min(0.95, float(conf_threshold)))
        imgsz_clamped = int(imgsz) if imgsz in [320, 416, 640] else settings.INFERENCE_IMAGE_SIZE

        try:
            # Ultralytics track integration with ByteTrack on configured device
            results = model_service.model.track(
                source=frame,
                persist=True,
                tracker="bytetrack.yaml",
                conf=conf_clamped,
                imgsz=imgsz_clamped,
                classes=list(COCO_TRAFFIC_CLASSES.keys()),
                device=settings.MODEL_DEVICE,
                verbose=False
            )

            latency_ms = (time.perf_counter() - t0) * 1000.0

            detections: List[Dict[str, Any]] = []
            if results and len(results) > 0 and results[0].boxes is not None:
                boxes = results[0].boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    if cls_id not in COCO_TRAFFIC_CLASSES:
                        continue

                    class_name = COCO_TRAFFIC_CLASSES[cls_id]
                    conf = float(box.conf[0].item())

                    track_id = None
                    if box.id is not None:
                        track_id = int(box.id[0].item())

                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = xyxy

                    # Ensure coordinates are within image boundaries
                    x1 = max(0, min(orig_w, x1))
                    y1 = max(0, min(orig_h, y1))
                    x2 = max(0, min(orig_w, x2))
                    y2 = max(0, min(orig_h, y2))

                    cx = (x1 + x2) / 2.0 / orig_w
                    cy = (y1 + y2) / 2.0 / orig_h

                    detections.append({
                        "track_id": track_id,
                        "class_name": class_name,
                        "confidence": conf,
                        "bbox": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2
                        },
                        "center_x": cx,
                        "center_y": cy
                    })

            return detections, latency_ms
        except Exception as e:
            logger.error(f"Inference error: {e}")
            latency_ms = (time.perf_counter() - t0) * 1000.0
            return [], latency_ms

detection_service = DetectionService()
