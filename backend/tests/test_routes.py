import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app
from config import settings
from routes.review import reset_rate_limits

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_env():
    settings.TESTING = True
    reset_rate_limits()
    yield
    settings.TESTING = True
    reset_rate_limits()

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
        "performance": [],
        "summary": "Mock summary test",
        "remediated_code": "def hello(): pass",
        "agent_statuses": {"style": "ok", "bugs": "ok", "security": "ok", "performance": "ok"}
    }

    with patch("routes.review.run_orchestrator", new=AsyncMock(return_value=mock_orchestration)):
        res = client.post("/review", json={"raw_code": "def hello(): pass"})
        assert res.status_code == 201
        data = res.json()
        assert "id" in data
        assert data["summary"] == "Mock summary test"
        assert len(data["style"]) == 1
        assert data["agent_statuses"]["style"] == "ok"

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

def test_rate_limiting_enforcement():
    settings.TESTING = False
    reset_rate_limits()
    settings.RATE_LIMIT_PER_MINUTE = 3

    mock_orchestration = {
        "style": [],
        "bugs": [],
        "security": [],
        "performance": [],
        "summary": "OK",
        "remediated_code": ""
    }

    with patch("routes.review.run_orchestrator", new=AsyncMock(return_value=mock_orchestration)):
        # Requests 1, 2, 3 should succeed
        for _ in range(3):
            res = client.post("/review", json={"raw_code": "x = 1"})
            assert res.status_code == 201

        # Request 4 should be rate limited with HTTP 429 and Retry-After
        res = client.post("/review", json={"raw_code": "x = 1"})
        assert res.status_code == 429
        assert "Rate limit exceeded" in res.json()["detail"]
        assert "Retry-After" in res.headers

    # Reset
    settings.TESTING = True
    reset_rate_limits()
