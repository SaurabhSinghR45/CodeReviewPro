import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_validation_both_inputs_given():
    res = client.post("/review", json={"github_url": "https://github.com/foo/bar/blob/main/a.py", "raw_code": "print(1)"})
    assert res.status_code == 400
    assert "either 'github_url' or 'raw_code', but not both" in res.json()["detail"]

def test_validation_neither_input_given():
    res = client.post("/review", json={})
    assert res.status_code == 400
    assert "Either 'github_url' or 'raw_code' must be provided" in res.json()["detail"]

def test_validation_oversized_code():
    big_code = "a" * 20005
    res = client.post("/review", json={"raw_code": big_code})
    assert res.status_code == 400
    assert "exceeds character limit" in res.json()["detail"]

def test_create_review_success():
    mock_orchestration = {
        "style": [{"line": "Line 1", "issue": "Format", "suggestion": "Fix"}],
        "bugs": [],
        "security": [],
        "summary": "Mock summary test"
    }

    with patch("routes.review.run_orchestrator", new=AsyncMock(return_value=mock_orchestration)):
        res = client.post("/review", json={"raw_code": "def hello(): pass"})
        assert res.status_code == 201
        data = res.json()
        assert "id" in data
        assert data["summary"] == "Mock summary test"
        assert len(data["style"]) == 1

        review_id = data["id"]

        # Test GET /reviews list
        list_res = client.get("/reviews")
        assert list_res.status_code == 200
        reviews_list = list_res.json()
        assert any(r["id"] == review_id for r in reviews_list)

        # Test GET /reviews/{id} detail
        detail_res = client.get(f"/reviews/{review_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["id"] == review_id
        assert detail_data["summary"] == "Mock summary test"
