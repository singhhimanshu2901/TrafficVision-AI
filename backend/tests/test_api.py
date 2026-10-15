import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db

@pytest.fixture(autouse=True, scope="session")
def setup_database():
    init_db()

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "TrafficVision AI"

def test_system_status():
    res = client.get("/api/system/status")
    assert res.status_code == 200
    data = res.json()
    assert "cpu_usage_percent" in data
    assert "memory_percent" in data
    assert data["device"] == "cpu"

def test_model_status():
    res = client.get("/api/models/status")
    assert res.status_code == 200
    data = res.json()
    assert data["model_name"] == "YOLOv8 Nano"
    assert "Pedestrian" in data["supported_classes"]
    assert "Car" in data["supported_classes"]
    assert "Bus" in data["supported_classes"]
    assert "Truck" in data["supported_classes"]

def test_settings_get_and_put():
    res = client.get("/api/settings")
    assert res.status_code == 200
    current = res.json()

    current["confidence_threshold"] = 0.42
    put_res = client.put("/api/settings", json=current)
    assert put_res.status_code == 200
    assert put_res.json()["confidence_threshold"] == 0.42

def test_session_lifecycle():
    # 1. Create a session
    payload = {
        "source_type": "upload",
        "source_name": "test_video.mp4",
        "confidence_threshold": 0.35,
        "inference_size": 416,
        "virtual_line": {
            "enabled": True,
            "x1": 0.1,
            "y1": 0.5,
            "x2": 0.9,
            "y2": 0.5,
            "direction": "bidirectional"
        }
    }
    create_res = client.post("/api/sessions", json=payload)
    assert create_res.status_code == 201
    session_data = create_res.json()
    session_id = session_data["id"]
    assert session_data["status"] == "running"

    # 2. Get session details
    get_res = client.get(f"/api/sessions/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == session_id

    # 3. Stop session
    stop_res = client.post(f"/api/sessions/{session_id}/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "stopped"

def test_invalid_session_handling():
    res = client.get("/api/sessions/non_existent_session_id")
    assert res.status_code == 404

def test_analytics_summary():
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_sessions" in data
    assert "total_vehicles" in data
    assert "total_pedestrians" in data
    assert "class_totals" in data
