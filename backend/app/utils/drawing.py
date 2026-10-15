import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple

# Aesthetic BGR colors
COLOR_BOX = (50, 205, 50)       # Vibrant lime green (BGR: 50, 205, 50)
COLOR_TEXT_BG = (20, 24, 33)    # Dark charcoal background
COLOR_TEXT = (255, 255, 255)    # Crisp white
COLOR_LINE = (0, 165, 255)      # Orange amber virtual line
COLOR_LINE_IN = (50, 205, 50)   # Green inbound
COLOR_LINE_OUT = (0, 0, 255)    # Red outbound

def draw_annotations(
    frame: np.ndarray,
    detections: List[Dict],
    virtual_line: Optional[Tuple[float, float, float, float]] = None,
    current_visible: Optional[Dict] = None,
    cumulative_unique: Optional[Dict] = None,
    fps: float = 0.0,
    show_boxes: bool = True,
    show_labels: bool = True,
    show_track_ids: bool = True
) -> np.ndarray:
    """
    Renders bounding boxes, tracking labels, virtual counting line,
    and information overlay onto an OpenCV BGR frame.
    """
    h, w = frame.shape[:2]
    annotated = frame.copy()

    # Draw virtual counting line if configured
    if virtual_line:
        lx1, ly1, lx2, ly2 = virtual_line
        pt1 = (int(lx1 * w), int(ly1 * h))
        pt2 = (int(lx2 * w), int(ly2 * h))
        cv2.line(annotated, pt1, pt2, COLOR_LINE, 2, cv2.LINE_AA)
        cv2.circle(annotated, pt1, 5, COLOR_LINE, -1)
        cv2.circle(annotated, pt2, 5, COLOR_LINE, -1)
        cv2.putText(annotated, "COUNTING LINE", (pt1[0] + 5, pt1[1] - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLOR_LINE, 1, cv2.LINE_AA)

    # Draw bounding boxes and labels
    for det in detections:
        bbox = det.get("bbox", {})
        x1 = int(bbox.get("x1", 0))
        y1 = int(bbox.get("y1", 0))
        x2 = int(bbox.get("x2", 0))
        y2 = int(bbox.get("y2", 0))
        cls_name = det.get("class_name", "Object").upper()
        conf = det.get("confidence", 0.0)
        track_id = det.get("track_id")

        if show_boxes:
            cv2.rectangle(annotated, (x1, y1), (x2, y2), COLOR_BOX, 2)

        if show_labels:
            # Build label text: e.g. "CAR #12 0.91"
            if show_track_ids and track_id is not None:
                label_text = f"{cls_name} #{track_id} {conf:.2f}"
            else:
                label_text = f"{cls_name} {conf:.2f}"

            # Calculate text size for badge background
            (txt_w, txt_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            badge_y1 = max(0, y1 - txt_h - 6)
            badge_y2 = y1

            # Background rectangle for text
            cv2.rectangle(annotated, (x1, badge_y1), (x1 + txt_w + 8, badge_y2), COLOR_BOX, -1)
            cv2.putText(annotated, label_text, (x1 + 4, badge_y2 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

    # Render HUD Telemetry Panel in top-left
    if current_visible and cumulative_unique:
        hud_bg = (15, 23, 42)
        cv2.rectangle(annotated, (12, 12), (320, 96), hud_bg, -1)
        cv2.rectangle(annotated, (12, 12), (320, 96), (40, 50, 70), 1)

        vis_veh = current_visible.get("total_vehicles", 0)
        vis_ped = current_visible.get("pedestrian", 0)
        cum_veh = cumulative_unique.get("total_vehicles", 0)
        cum_ped = cumulative_unique.get("pedestrian", 0)

        cv2.putText(annotated, f"TRAFFICVISION AI | {fps:.1f} FPS", (22, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (50, 205, 50), 1, cv2.LINE_AA)
        cv2.putText(annotated, f"VISIBLE: {vis_veh} Vehicles  {vis_ped} Pedestrians", (22, 56),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (240, 240, 240), 1, cv2.LINE_AA)
        cv2.putText(annotated, f"UNIQUE:  {cum_veh} Vehicles  {cum_ped} Pedestrians", (22, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 200, 220), 1, cv2.LINE_AA)

    return annotated
