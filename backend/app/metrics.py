import pandas as pd
import numpy as np
from typing import Dict, Any, List

def compute_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute forecast evaluation metrics across joined dataset.
    Columns required: forecast_mw, actual_mw
    """
    if df.empty:
        return {
            "MAE_MW": 0.0,
            "RMSE_MW": 0.0,
            "Bias_MW": 0.0,
            "WAPE_pct": 0.0,
            "N": 0,
            "missing_intervals": 0,
            "mean_actual_mw": 0.0,
            "mean_forecast_mw": 0.0,
            "correlation": 0.0,
            "scope_warning": False,
            "scope_warning_msg": None,
            "by_day": []
        }

    valid = df.dropna(subset=["forecast_mw", "actual_mw"]).copy()
    total_len = len(df)
    n = len(valid)

    if n == 0:
        return {
            "MAE_MW": 0.0,
            "RMSE_MW": 0.0,
            "Bias_MW": 0.0,
            "WAPE_pct": 0.0,
            "N": 0,
            "missing_intervals": total_len,
            "mean_actual_mw": 0.0,
            "mean_forecast_mw": 0.0,
            "correlation": 0.0,
            "scope_warning": False,
            "scope_warning_msg": "No paired forecast/actual intervals available.",
            "by_day": []
        }

    err = valid["forecast_mw"] - valid["actual_mw"]
    mae = float(err.abs().mean())
    rmse = float(np.sqrt((err**2).mean()))
    bias = float(err.mean())
    sum_actual = float(valid["actual_mw"].sum())
    wape = float((err.abs().sum() / sum_actual * 100.0) if sum_actual > 0 else 0.0)
    mean_actual = float(valid["actual_mw"].mean())
    mean_forecast = float(valid["forecast_mw"].mean())

    corr = 0.0
    if valid["actual_mw"].std() > 0 and valid["forecast_mw"].std() > 0:
        corr = float(valid["actual_mw"].corr(valid["forecast_mw"]))

    scope_warning = abs(bias) > 2000.0
    scope_warning_msg = (
        "Structural Bias Notice: WINDFOR is National Grid ESO / NESO's GB total wind forecast "
        "(including ~6-8 GW of distribution-connected embedded wind). FUELHH measures only "
        "transmission Balancing Mechanism (BM) connected metered generation. The observed +4,000 to +5,000 MW "
        "bias primarily reflects this structural scope difference rather than a predictive modeling flaw."
        if scope_warning else None
    )

    # Per-day breakdown
    by_day: List[Dict[str, Any]] = []
    if "delivery_date" in valid.columns:
        for deliv_date, group in valid.groupby("delivery_date"):
            g_err = group["forecast_mw"] - group["actual_mw"]
            g_sum_act = float(group["actual_mw"].sum())
            g_pub_time = group["forecast_publishTime"].iloc[0] if "forecast_publishTime" in group.columns else None
            by_day.append({
                "date": str(deliv_date),
                "trading_date": str(group["trading_date"].iloc[0]) if "trading_date" in group.columns else None,
                "MAE_MW": round(float(g_err.abs().mean()), 1),
                "RMSE_MW": round(float(np.sqrt((g_err**2).mean())), 1),
                "Bias_MW": round(float(g_err.mean()), 1),
                "WAPE_pct": round(float((g_err.abs().sum() / g_sum_act * 100.0) if g_sum_act > 0 else 0.0), 2),
                "mean_actual_mw": round(float(group["actual_mw"].mean()), 1),
                "mean_forecast_mw": round(float(group["forecast_mw"].mean()), 1),
                "N": len(group),
                "forecast_publishTime": g_pub_time
            })

    return {
        "MAE_MW": round(mae, 1),
        "RMSE_MW": round(rmse, 1),
        "Bias_MW": round(bias, 1),
        "WAPE_pct": round(wape, 2),
        "N": n,
        "missing_intervals": total_len - n,
        "mean_actual_mw": round(mean_actual, 1),
        "mean_forecast_mw": round(mean_forecast, 1),
        "correlation": round(corr, 3),
        "scope_warning": scope_warning,
        "scope_warning_msg": scope_warning_msg,
        "by_day": by_day
    }
