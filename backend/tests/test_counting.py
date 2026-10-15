import pytest
from app.services.counting_service import SessionCounter, LineCrossingCounter
from app.schemas.detection import ClassCounts

def test_case_1_no_movement():
    """Object stays at the exact same location across multiple frames; counts must not increment."""
    counter = SessionCounter()
    tracks = [{"track_id": 1, "class_name": "Car", "confidence": 0.90, "center_x": 0.5, "center_y": 0.2}]

    # Frame 1
    vis1, cum1, events1 = counter.process_frame_tracks(tracks)
    assert vis1.car == 1
    assert cum1.car == 1
    assert len(events1) == 0

    # Frame 2 (no movement)
    vis2, cum2, events2 = counter.process_frame_tracks(tracks)
    assert vis2.car == 1
    assert cum2.car == 1  # Still 1 unique car
    assert len(events2) == 0

def test_case_2_movement_without_crossing():
    """Object moves but stays on the same side of the virtual counting line (y=0.5)."""
    counter = SessionCounter()
    # Moves from y=0.2 to y=0.3 to y=0.4 (all above line y=0.5)
    f1 = [{"track_id": 5, "class_name": "Truck", "confidence": 0.88, "center_x": 0.5, "center_y": 0.2}]
    f2 = [{"track_id": 5, "class_name": "Truck", "confidence": 0.89, "center_x": 0.5, "center_y": 0.3}]
    f3 = [{"track_id": 5, "class_name": "Truck", "confidence": 0.87, "center_x": 0.5, "center_y": 0.4}]

    counter.process_frame_tracks(f1)
    counter.process_frame_tracks(f2)
    vis, cum, events = counter.process_frame_tracks(f3)

    assert vis.truck == 1
    assert cum.truck == 1
    assert len(events) == 0
    assert counter.line_counter.inbound_count == 0
    assert counter.line_counter.outbound_count == 0

def test_case_3_valid_inbound_crossing():
    """Object moves from y=0.4 to y=0.6, crossing line at y=0.5 in inbound direction."""
    counter = SessionCounter((0.0, 0.5, 1.0, 0.5, "bidirectional"))

    f1 = [{"track_id": 10, "class_name": "Bus", "confidence": 0.92, "center_x": 0.5, "center_y": 0.4}]
    f2 = [{"track_id": 10, "class_name": "Bus", "confidence": 0.93, "center_x": 0.5, "center_y": 0.6}]

    counter.process_frame_tracks(f1)
    vis, cum, events = counter.process_frame_tracks(f2)

    assert len(events) == 1
    track_id, cls_name, direction, conf = events[0]
    assert track_id == 10
    assert cls_name == "Bus"
    assert direction in ["inbound", "outbound"]
    assert (counter.line_counter.inbound_count + counter.line_counter.outbound_count) == 1

def test_case_4_valid_outbound_crossing():
    """Object moves from y=0.6 to y=0.4, crossing line in the reverse direction."""
    counter = SessionCounter((0.0, 0.5, 1.0, 0.5, "bidirectional"))

    f1 = [{"track_id": 12, "class_name": "Car", "confidence": 0.89, "center_x": 0.5, "center_y": 0.6}]
    f2 = [{"track_id": 12, "class_name": "Car", "confidence": 0.90, "center_x": 0.5, "center_y": 0.4}]

    counter.process_frame_tracks(f1)
    vis, cum, events = counter.process_frame_tracks(f2)

    assert len(events) == 1
    track_id, cls_name, direction, conf = events[0]
    assert track_id == 12
    assert (counter.line_counter.inbound_count + counter.line_counter.outbound_count) == 1

def test_case_5_repeated_frames_after_crossing():
    """After crossing, the object continues moving on the other side; NO duplicate event."""
    counter = SessionCounter((0.0, 0.5, 1.0, 0.5, "bidirectional"))

    f1 = [{"track_id": 20, "class_name": "Motorcycle", "confidence": 0.85, "center_x": 0.5, "center_y": 0.4}]
    f2 = [{"track_id": 20, "class_name": "Motorcycle", "confidence": 0.86, "center_x": 0.5, "center_y": 0.6}]
    f3 = [{"track_id": 20, "class_name": "Motorcycle", "confidence": 0.87, "center_x": 0.5, "center_y": 0.7}]
    f4 = [{"track_id": 20, "class_name": "Motorcycle", "confidence": 0.88, "center_x": 0.5, "center_y": 0.8}]

    counter.process_frame_tracks(f1)
    _, _, ev2 = counter.process_frame_tracks(f2) # Crossing happens here
    assert len(ev2) == 1

    _, _, ev3 = counter.process_frame_tracks(f3)
    assert len(ev3) == 0  # No duplicate event

    _, _, ev4 = counter.process_frame_tracks(f4)
    assert len(ev4) == 0  # No duplicate event

    assert (counter.line_counter.inbound_count + counter.line_counter.outbound_count) == 1

def test_case_6_repeated_crossing_event_prevention():
    """If the object oscillates back across the line, deduplication prevents duplicate counts for the same track."""
    line_counter = LineCrossingCounter(0.0, 0.5, 1.0, 0.5, "bidirectional")

    # Forward crossing
    dir1 = line_counter.check_crossing(100, (0.5, 0.4), (0.5, 0.6))
    assert dir1 is not None

    # Backward movement crossing back
    dir2 = line_counter.check_crossing(100, (0.5, 0.6), (0.5, 0.4))
    assert dir2 is None  # Blocked by crossed_tracks deduplication set

def test_case_7_multiple_different_tracks():
    """Multiple different objects crossing simultaneously should each register their own event."""
    counter = SessionCounter((0.0, 0.5, 1.0, 0.5, "bidirectional"))

    f1 = [
        {"track_id": 1, "class_name": "Car", "confidence": 0.91, "center_x": 0.3, "center_y": 0.4},
        {"track_id": 2, "class_name": "Pedestrian", "confidence": 0.95, "center_x": 0.8, "center_y": 0.4},
    ]
    f2 = [
        {"track_id": 1, "class_name": "Car", "confidence": 0.91, "center_x": 0.3, "center_y": 0.6},
        {"track_id": 2, "class_name": "Pedestrian", "confidence": 0.95, "center_x": 0.8, "center_y": 0.6},
    ]

    counter.process_frame_tracks(f1)
    vis, cum, events = counter.process_frame_tracks(f2)

    assert len(events) == 2
    assert cum.car == 1
    assert cum.pedestrian == 1
    assert (counter.line_counter.inbound_count + counter.line_counter.outbound_count) == 2

def test_case_8_missing_tracking_ids():
    """Detections without tracking IDs (None) should still be counted in visible metrics but not in unique cumulative tracks."""
    counter = SessionCounter()

    f1 = [
        {"track_id": None, "class_name": "Car", "confidence": 0.75, "center_x": 0.4, "center_y": 0.3},
        {"track_id": 10, "class_name": "Bicycle", "confidence": 0.82, "center_x": 0.6, "center_y": 0.3},
    ]

    vis, cum, events = counter.process_frame_tracks(f1)
    assert vis.car == 1
    assert vis.bicycle == 1
    # Car has no track ID, so it is not added to cumulative unique tracks
    assert cum.car == 0
    assert cum.bicycle == 1

def test_case_9_session_reset():
    """A newly created session counter must start with clean zero counts and not inherit old state."""
    c1 = SessionCounter()
    c1.process_frame_tracks([{"track_id": 1, "class_name": "Car", "confidence": 0.9, "center_x": 0.5, "center_y": 0.2}])
    assert c1.cumulative.car == 1

    # New fresh session counter
    c2 = SessionCounter()
    assert c2.cumulative.car == 0
    assert c2.cumulative.total_vehicles == 0
    assert c2.cumulative.pedestrian == 0
    assert len(c2.seen_track_ids) == 0
    assert c2.line_counter.inbound_count == 0
    assert c2.line_counter.outbound_count == 0

def test_case_10_boundary_and_vertical_line_orientation():
    """Test vertical counting line (x=0.5, from y=0.0 to y=1.0) with crossing from left to right."""
    line_counter = LineCrossingCounter(0.5, 0.0, 0.5, 1.0, "bidirectional")

    # Crosses vertical line at x=0.5 from x=0.4 to x=0.6
    dir1 = line_counter.check_crossing(50, (0.4, 0.5), (0.6, 0.5))
    assert dir1 in ["inbound", "outbound"]
    assert (line_counter.inbound_count + line_counter.outbound_count) == 1

    # Same track moving further right
    dir2 = line_counter.check_crossing(50, (0.6, 0.5), (0.7, 0.5))
    assert dir2 is None
