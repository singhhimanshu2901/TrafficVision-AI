import pytest
from app.services.model_service import COCO_TRAFFIC_CLASSES

def test_coco_classes_explicit_mapping():
    """Verify supported traffic classes are strictly mapped without non-traffic COCO classes."""
    assert COCO_TRAFFIC_CLASSES[0] == "Pedestrian"
    assert COCO_TRAFFIC_CLASSES[1] == "Bicycle"
    assert COCO_TRAFFIC_CLASSES[2] == "Car"
    assert COCO_TRAFFIC_CLASSES[3] == "Motorcycle"
    assert COCO_TRAFFIC_CLASSES[5] == "Bus"
    assert COCO_TRAFFIC_CLASSES[7] == "Truck"
    assert 4 not in COCO_TRAFFIC_CLASSES # Airplane excluded
    assert 15 not in COCO_TRAFFIC_CLASSES # Cat excluded
