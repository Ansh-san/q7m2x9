import pytest
import pandas as pd
import numpy as np
from app.metrics import compute_metrics

def test_compute_metrics_accuracy():
    df = pd.DataFrame([
        {"actual_mw": 1000.0, "forecast_mw": 1200.0, "delivery_date": "2026-01-02", "trading_date": "2026-01-01"},
        {"actual_mw": 2000.0, "forecast_mw": 1800.0, "delivery_date": "2026-01-02", "trading_date": "2026-01-01"},
        {"actual_mw": 3000.0, "forecast_mw": 3100.0, "delivery_date": "2026-01-03", "trading_date": "2026-01-02"},
    ])
    # errs: +200, -200, +100
    # abs errs: 200, 200, 100 -> mean = 500 / 3 = 166.7
    # err^2: 40000, 40000, 10000 -> mean = 90000 / 3 = 30000 -> sqrt = 173.2
    # bias: (200 - 200 + 100) / 3 = 33.3
    # wape: (500) / (6000) * 100 = 8.33%
    m = compute_metrics(df)
    assert m["N"] == 3
    assert m["MAE_MW"] == 166.7
    assert m["RMSE_MW"] == 173.2
    assert m["Bias_MW"] == 33.3
    assert m["WAPE_pct"] == 8.33
    assert m["scope_warning"] is False
    assert len(m["by_day"]) == 2

def test_scope_warning_large_bias():
    # Simulating WINDFOR vs FUELHH typical January gap (+2500 MW)
    df = pd.DataFrame([
        {"actual_mw": 10000.0, "forecast_mw": 12500.0, "delivery_date": "2026-01-02"},
        {"actual_mw": 12000.0, "forecast_mw": 14500.0, "delivery_date": "2026-01-02"},
    ])
    m = compute_metrics(df)
    assert m["scope_warning"] is True
    assert m["scope_warning_msg"] is not None
    assert "operational metering" in m["scope_warning_msg"].lower()
    assert m["Bias_MW"] > 2000

def test_empty_dataset_handling():
    m = compute_metrics(pd.DataFrame())
    assert m["N"] == 0
    assert m["MAE_MW"] == 0.0
