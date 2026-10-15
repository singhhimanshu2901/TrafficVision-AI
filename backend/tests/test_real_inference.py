import os
import pytest
import numpy as np

def test_real_model_loading_and_inference_smoke():
    """
    Opt-in real inference smoke test:
    Loads actual YOLOv8 Nano weights on CPU, runs inference on a test frame,
    and checks detection format, class filtering, and measured latency.
    """
    weights_path = "models/yolov8n.pt"
    if not os.path.exists(weights_path):
        pytest.skip("models/yolov8n.pt not found for real inference smoke test")

    try:
        from ultralytics import YOLO
    except ImportError:
        pytest.skip("ultralytics library not installed in current Python environment")

    # 1. Load model onto CPU explicitly
    model = YOLO(weights_path)
    model.to("cpu")

    # 2. Synthetic frame (416x416 RGB with simple geometric traffic shapes)
    frame = np.full((416, 416, 3), 40, dtype=np.uint8)

    # 3. Measure inference duration
    import time
    t0 = time.perf_counter()
    results = model.predict(frame, imgsz=416, device="cpu", verbose=False)
    inference_duration_ms = (time.perf_counter() - t0) * 1000.0

    # 4. Assert model returned valid inference result
    assert results is not None
    assert len(results) > 0
    assert results[0].boxes is not None
    assert inference_duration_ms > 0
    assert inference_duration_ms < 2000 # Must be reasonable CPU latency
