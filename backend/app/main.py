import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from app.ingest import fetch_fuelhh_data, fetch_windfor_data
from app.transform import build_joined_dataset
from app.metrics import compute_metrics

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("windpulse")

# Global in-memory cache
DATA_STORE: Dict[str, Any] = {
    "fuelhh_df": pd.DataFrame(),
    "windfor_df": pd.DataFrame(),
    "joined_cache": {},  # key: cutoff string, value: DataFrame
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing WindPulse backend datasets...")
    try:
        fuelhh_df = await fetch_fuelhh_data()
        windfor_df = await fetch_windfor_data()
        DATA_STORE["fuelhh_df"] = fuelhh_df
        DATA_STORE["windfor_df"] = windfor_df
        # Precompute default 09:50 cutoff
        default_joined = build_joined_dataset(fuelhh_df, windfor_df, cutoff_local="09:50")
        DATA_STORE["joined_cache"]["09:50"] = default_joined
        logger.info(f"WindPulse startup complete. Joined records (09:50): {len(default_joined)}")
    except Exception as e:
        logger.error(f"Error during data ingestion startup: {e}", exc_info=True)
    yield
    logger.info("WindPulse backend shutting down.")

app = FastAPI(
    title="WindPulse API",
    description="UK Wind Generation Forecast Intelligence API for Gridbricks Challenge",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_joined_data(cutoff: str = "09:50") -> pd.DataFrame:
    cutoff = cutoff.strip()
    if cutoff in DATA_STORE["joined_cache"]:
        return DATA_STORE["joined_cache"][cutoff]
    
    fuelhh_df = DATA_STORE["fuelhh_df"]
    windfor_df = DATA_STORE["windfor_df"]
    if fuelhh_df.empty or windfor_df.empty:
        raise HTTPException(status_code=503, detail="Datasets are not initialized yet.")
    
    joined = build_joined_dataset(fuelhh_df, windfor_df, cutoff_local=cutoff)
    DATA_STORE["joined_cache"][cutoff] = joined
    return joined


@app.get("/api/health")
async def health_check():
    fuelhh_count = len(DATA_STORE["fuelhh_df"])
    windfor_count = len(DATA_STORE["windfor_df"])
    return {
        "status": "healthy" if fuelhh_count > 0 and windfor_count > 0 else "initializing",
        "fuelhh_records": fuelhh_count,
        "windfor_snapshots_records": windfor_count,
        "default_cutoff": "09:50 Europe/London",
        "trading_period": "2026-01-01 to 2026-01-31",
        "delivery_period": "2026-01-02 to 2026-02-01",
        "total_expected_intervals": 744
    }


@app.get("/api/timeseries")
async def get_timeseries(
    date: Optional[str] = Query(None, description="Filter by delivery date YYYY-MM-DD (e.g. 2026-01-15)"),
    trading_date: Optional[str] = Query(None, description="Filter by trading decision date YYYY-MM-DD"),
    cutoff: str = Query("09:50", description="Trading day cutoff in Europe/London (HH:MM)")
):
    df = get_joined_data(cutoff)
    if df.empty:
        return []

    filtered = df.copy()
    if date:
        filtered = filtered[filtered["delivery_date"] == date]
    elif trading_date:
        filtered = filtered[filtered["trading_date"] == trading_date]

    # Convert timestamps and NaNs to serializable types
    results = []
    for _, row in filtered.iterrows():
        st = row["startTime"]
        st_str = st.isoformat() if hasattr(st, "isoformat") else str(st)
        act = None if pd.isna(row["actual_mw"]) else round(float(row["actual_mw"]), 1)
        fc = None if pd.isna(row["forecast_mw"]) else round(float(row["forecast_mw"]), 1)
        err = None if pd.isna(row["error_mw"]) else round(float(row["error_mw"]), 1)
        age = None if pd.isna(row["forecast_age_at_cutoff_minutes"]) else float(row["forecast_age_at_cutoff_minutes"])
        lead = None if pd.isna(row["forecast_lead_time_hours"]) else float(row["forecast_lead_time_hours"])

        results.append({
            "startTime": st_str,
            "trading_date": str(row["trading_date"]),
            "delivery_date": str(row["delivery_date"]),
            "cutoff_utc": str(row["cutoff_utc"]),
            "actual_mw": act,
            "forecast_mw": fc,
            "error_mw": err,
            "sp_count": int(row["sp_count"]) if not pd.isna(row["sp_count"]) else 0,
            "forecast_publishTime": row["forecast_publishTime"] if not pd.isna(row["forecast_publishTime"]) else None,
            "forecast_age_at_cutoff_minutes": age,
            "forecast_lead_time_hours": lead
        })
    return results


@app.get("/api/metrics")
async def get_metrics(
    date: Optional[str] = Query(None, description="Filter metrics by delivery date YYYY-MM-DD"),
    cutoff: str = Query("09:50", description="Trading day cutoff in Europe/London (HH:MM)")
):
    df = get_joined_data(cutoff)
    if df.empty:
        return compute_metrics(pd.DataFrame())

    if date:
        df = df[df["delivery_date"] == date]

    return compute_metrics(df)


@app.get("/api/calendar")
async def get_calendar(
    cutoff: str = Query("09:50", description="Trading day cutoff in Europe/London (HH:MM)")
):
    df = get_joined_data(cutoff)
    if df.empty:
        return []

    days = []
    for (deliv_date, trad_date), group in df.groupby(["delivery_date", "trading_date"]):
        valid = group.dropna(subset=["forecast_mw", "actual_mw"])
        act_mean = round(float(group["actual_mw"].mean()), 1) if not group["actual_mw"].isna().all() else None
        fc_mean = round(float(group["forecast_mw"].mean()), 1) if not group["forecast_mw"].isna().all() else None
        err_mean = round(float(group["error_mw"].mean()), 1) if not group["error_mw"].isna().all() else None
        
        pub_time = group["forecast_publishTime"].iloc[0] if not group["forecast_publishTime"].isna().all() else None
        age_mins = group["forecast_age_at_cutoff_minutes"].iloc[0] if not group["forecast_age_at_cutoff_minutes"].isna().all() else None

        days.append({
            "delivery_date": str(deliv_date),
            "trading_date": str(trad_date),
            "has_forecast": not group["forecast_mw"].isna().all(),
            "has_actual": not group["actual_mw"].isna().all(),
            "count_intervals": len(group),
            "valid_paired_intervals": len(valid),
            "mean_actual_mw": act_mean,
            "mean_forecast_mw": fc_mean,
            "mean_error_mw": err_mean,
            "da_snapshot_publishTime": pub_time,
            "forecast_age_at_cutoff_minutes": age_mins
        })
    return days
