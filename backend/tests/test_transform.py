import pytest
from datetime import date, datetime, timezone
import pandas as pd
import numpy as np
from app.transform import (
    get_da_cutoff_utc,
    resample_fuelhh_to_hourly,
    extract_da_forecasts,
    build_joined_dataset
)

def test_cutoff_utc():
    d = date(2026, 1, 15)
    cutoff = get_da_cutoff_utc(d, "09:50")
    assert cutoff.tzinfo == timezone.utc
    assert cutoff.hour == 9
    assert cutoff.minute == 50
    assert cutoff.day == 15

def test_resample_fuelhh_both_present():
    df = pd.DataFrame([
        {"startTime": "2026-01-02T00:00:00Z", "generation": 1000},
        {"startTime": "2026-01-02T00:30:00Z", "generation": 2000},
        {"startTime": "2026-01-02T01:00:00Z", "generation": 3000},
        {"startTime": "2026-01-02T01:30:00Z", "generation": 5000},
    ])
    hourly = resample_fuelhh_to_hourly(df)
    assert len(hourly) == 2
    assert hourly.iloc[0]["actual_mw"] == 1500.0
    assert hourly.iloc[0]["sp_count"] == 2
    assert hourly.iloc[1]["actual_mw"] == 4000.0

def test_resample_fuelhh_missing_half_hour():
    # Only 1 SP for hour 00:00
    df = pd.DataFrame([
        {"startTime": "2026-01-02T00:00:00Z", "generation": 1000},
        {"startTime": "2026-01-02T01:00:00Z", "generation": 3000},
        {"startTime": "2026-01-02T01:30:00Z", "generation": 5000},
    ])
    hourly = resample_fuelhh_to_hourly(df)
    assert np.isnan(hourly.iloc[0]["actual_mw"])
    assert hourly.iloc[0]["sp_count"] == 1
    assert hourly.iloc[1]["actual_mw"] == 4000.0
    assert hourly.iloc[1]["sp_count"] == 2

def test_da_forecast_cutoff_strictness():
    # Trading date: 2026-01-01 -> Delivery date: 2026-01-02
    # Cutoff: 2026-01-01 09:50:00 UTC
    windfor_data = [
        # Older eligible snapshot
        {
            "publishTime": "2026-01-01T06:00:00Z",
            "startTime": "2026-01-02T00:00:00Z",
            "generation": 12000
        },
        # Latest eligible snapshot before 09:50
        {
            "publishTime": "2026-01-01T09:30:00Z",
            "startTime": "2026-01-02T00:00:00Z",
            "generation": 14000
        },
        # Contaminated snapshot published AFTER cutoff (should be IGNORED)
        {
            "publishTime": "2026-01-01T10:00:00Z",
            "startTime": "2026-01-02T00:00:00Z",
            "generation": 25000
        }
    ]
    df_wind = pd.DataFrame(windfor_data)
    t_days = pd.date_range("2026-01-01", "2026-01-01", freq="D")
    result = extract_da_forecasts(df_wind, trading_dates=t_days, cutoff_local="09:50")

    assert not result.empty
    row_00 = result[result["startTime"] == pd.Timestamp("2026-01-02 00:00:00Z")].iloc[0]
    # Must pick the 09:30 snapshot, NOT the 10:00 snapshot
    assert row_00["forecast_mw"] == 14000
    assert "2026-01-01T09:30:00" in row_00["forecast_publishTime"]
    assert row_00["forecast_age_at_cutoff_minutes"] == 20.0
    assert row_00["delivery_date"] == "2026-01-02"
    assert row_00["trading_date"] == "2026-01-01"
