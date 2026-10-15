from typing import Dict, Set, Tuple, Optional, List
from app.schemas.detection import ClassCounts

class LineCrossingCounter:
    """
    Computes geometric line crossings for object tracking trajectories.
    Prevents duplicate crossing counts for the same track ID.
    """
    def __init__(self, x1: float, y1: float, x2: float, y2: float, direction: str = "bidirectional"):
        self.p1 = (x1, y1)
        self.p2 = (x2, y2)
        self.direction = direction # "inbound", "outbound", "bidirectional"
        self.inbound_count = 0
        self.outbound_count = 0
        self.crossed_tracks: Set[int] = set()

    def update_line(self, x1: float, y1: float, x2: float, y2: float, direction: str = "bidirectional"):
        self.p1 = (x1, y1)
        self.p2 = (x2, y2)
        self.direction = direction

    def _cross_product(self, p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
        # Cross product of vector (p2 - p1) and (p3 - p1)
        return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])

    def _segments_intersect(self, a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float], d: Tuple[float, float]) -> bool:
        # Check if line segments AB and CD intersect
        cp1 = self._cross_product(a, b, c)
        cp2 = self._cross_product(a, b, d)
        cp3 = self._cross_product(c, d, a)
        cp4 = self._cross_product(c, d, b)

        if ((cp1 > 0 and cp2 < 0) or (cp1 < 0 and cp2 > 0)) and \
           ((cp3 > 0 and cp4 < 0) or (cp3 < 0 and cp4 > 0)):
            return True
        return False

    def check_crossing(self, track_id: int, prev_center: Tuple[float, float], curr_center: Tuple[float, float]) -> Optional[str]:
        if track_id in self.crossed_tracks:
            return None

        # Line segment representing the virtual gate
        a, b = self.p1, self.p2
        # Object trajectory segment
        c, d = prev_center, curr_center

        if self._segments_intersect(a, b, c, d):
            # Determine direction using vector cross product relative to the virtual line
            cp_prev = self._cross_product(a, b, c)
            cp_curr = self._cross_product(a, b, d)

            # Inbound vs Outbound determined by crossing side
            event_dir = "inbound" if cp_curr > 0 else "outbound"

            if self.direction == "bidirectional" or self.direction == event_dir:
                self.crossed_tracks.add(track_id)
                if event_dir == "inbound":
                    self.inbound_count += 1
                else:
                    self.outbound_count += 1
                return event_dir

        return None


class SessionCounter:
    """
    Maintains visible counts, cumulative unique counts, and trajectory tracking.
    """
    def __init__(self, virtual_line: Optional[Tuple[float, float, float, float, str]] = None):
        self.seen_track_ids: Set[int] = set()
        self.track_classes: Dict[int, str] = {}
        self.track_positions: Dict[int, Tuple[float, float]] = {}

        # Cumulative unique counts by class
        self.cumulative = ClassCounts()

        # Virtual line counter
        if virtual_line:
            self.line_counter = LineCrossingCounter(*virtual_line)
        else:
            self.line_counter = LineCrossingCounter(0.1, 0.5, 0.9, 0.5, "bidirectional")

    def process_frame_tracks(self, tracks: List[Dict]) -> Tuple[ClassCounts, ClassCounts, List[Tuple[int, str, str, float]]]:
        """
        Process tracks in current frame:
        Returns:
            - current_visible: counts of objects in this frame
            - cumulative_unique: distinct object counts ever seen
            - crossing_events: list of (track_id, class_name, direction, confidence)
        """
        current_visible = ClassCounts()
        crossing_events = []

        for trk in tracks:
            track_id = trk.get("track_id")
            cls_name = trk.get("class_name", "Car").capitalize()
            confidence = trk.get("confidence", 0.0)
            curr_center = (trk.get("center_x", 0.0), trk.get("center_y", 0.0))

            # Update visible counts
            cls_key = cls_name.lower()
            if cls_key == "pedestrian":
                current_visible.pedestrian += 1
            elif cls_key == "car":
                current_visible.car += 1
            elif cls_key == "bus":
                current_visible.bus += 1
            elif cls_key == "truck":
                current_visible.truck += 1
            elif cls_key == "motorcycle":
                current_visible.motorcycle += 1
            elif cls_key == "bicycle":
                current_visible.bicycle += 1

            if cls_key in ["car", "bus", "truck", "motorcycle", "bicycle"]:
                current_visible.total_vehicles += 1

            # Cumulative unique counting (ONLY on new track ID)
            if track_id is not None and track_id not in self.seen_track_ids:
                self.seen_track_ids.add(track_id)
                self.track_classes[track_id] = cls_name

                if cls_key == "pedestrian":
                    self.cumulative.pedestrian += 1
                elif cls_key == "car":
                    self.cumulative.car += 1
                elif cls_key == "bus":
                    self.cumulative.bus += 1
                elif cls_key == "truck":
                    self.cumulative.truck += 1
                elif cls_key == "motorcycle":
                    self.cumulative.motorcycle += 1
                elif cls_key == "bicycle":
                    self.cumulative.bicycle += 1

                if cls_key in ["car", "bus", "truck", "motorcycle", "bicycle"]:
                    self.cumulative.total_vehicles += 1

            # Line crossing calculation
            if track_id is not None:
                if track_id in self.track_positions:
                    prev_center = self.track_positions[track_id]
                    direction = self.line_counter.check_crossing(track_id, prev_center, curr_center)
                    if direction:
                        crossing_events.append((track_id, cls_name, direction, confidence))
                self.track_positions[track_id] = curr_center

        return current_visible, self.cumulative, crossing_events
