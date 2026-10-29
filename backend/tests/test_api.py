import pytest
from fastapi.testclient import TestClient
import pandas as pd
from app.main import app, DATA_STORE

@pytest.fixture(autouse=True)
def setup_mock_data():
    # Setup mock data in DATA_STORE
    fuelhh_df = pd.DataFrame([
        {"startTime": "2026-01-02T00:00:00Z", "generation": 10000},
        {"startTime": "2026-01-02T00:30:00Z", "generation": 12000},
        {"startTime": "2026-01-02T01:00:00Z", "generation": 11000},
        {"startTime": "2026-01-02T01:30:00Z", "generation": 13000},
    ])
    windfor_df = pd.DataFrame([
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 15000},
        {"startTime": "2026-01-02T01:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 16000},
    ])
    DATA_STORE["fuelhh_df"] = fuelhh_df
    DATA_STORE["windfor_df"] = windfor_df
    DATA_STORE["joined_cache"].clear()

def test_health_endpoint():
    client = TestClient(app)
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["fuelhh_records"] > 0

def test_timeseries_endpoint():
    client = TestClient(app)
    resp = client.get("/api/timeseries?date=2026-01-02&cutoff=09:50")
    assert resp.status_code == 200
    records = resp.json()
    assert len(records) == 24
    assert records[0]["actual_mw"] == 11000.0  # mean of 10000 and 12000
    assert records[0]["forecast_mw"] == 15000.0
    assert records[0]["error_mw"] == 4000.0
    assert records[0]["delivery_date"] == "2026-01-02"
    assert records[0]["trading_date"] == "2026-01-01"

def test_metrics_endpoint():
    client = TestClient(app)
    resp = client.get("/api/metrics?cutoff=09:50")
    assert resp.status_code == 200
    data = resp.json()
    assert data["N"] >= 2
    assert "MAE_MW" in data
    assert "Bias_MW" in data

def test_calendar_endpoint():
    client = TestClient(app)
    resp = client.get("/api/calendar?cutoff=09:50")
    assert resp.status_code == 200
    days = resp.json()
    assert len(days) >= 1
    assert "delivery_date" in days[0]
    assert "trading_date" in days[0]
