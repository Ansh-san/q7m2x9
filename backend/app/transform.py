import logging
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)
TZ_LONDON = ZoneInfo("Europe/London")

def get_da_cutoff_utc(trading_date: date, cutoff_local: str = "09:50") -> datetime:
    """
    Calculate the day-ahead gate-close cutoff in UTC for a given trading date.
    Cutoff time is defined in Europe/London local time (default 09:50).
    In January (GMT), Europe/London is UTC+0.
    """
    try:
        parts = cutoff_local.strip().split(":")
        h, m = int(parts[0]), int(parts[1])
    except Exception:
        h, m = 9, 50

    local_dt = datetime(trading_date.year, trading_date.month, trading_date.day, h, m, tzinfo=TZ_LONDON)
    return local_dt.astimezone(timezone.utc)


def resample_fuelhh_to_hourly(
    fuelhh_df: pd.DataFrame,
    start_utc: Optional[datetime] = None,
    end_utc: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Convert FUELHH half-hourly actuals to 1-hour average MW.
    Rule: Compute average only when both half-hour readings are present (sp_count == 2).
    If sp_count < 2, actual_mw is set to NaN.
    Optionally filters to the delivery interval range [start_utc, end_utc].
    """
    if fuelhh_df.empty:
        return pd.DataFrame(columns=["startTime", "actual_mw", "sp_count"])

    df = fuelhh_df.copy()
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    if start_utc is not None:
        df = df[df["startTime"] >= start_utc]
    if end_utc is not None:
        df = df[df["startTime"] <= end_utc]

    hourly = (
        df.set_index("startTime")
        .resample("1h", label="left", closed="left")["generation"]
        .agg(["mean", "count"])
        .reset_index()
        .rename(columns={"mean": "actual_mw", "count": "sp_count"})
    )

    # Convert to NaN if both half-hours are not present
    hourly.loc[hourly["sp_count"] < 2, "actual_mw"] = np.nan
    return hourly


def extract_da_forecasts(
    windfor_df: pd.DataFrame,
    trading_dates: Optional[pd.DatetimeIndex] = None,
    cutoff_local: str = "09:50",
    lookback_hours: int = 48
) -> pd.DataFrame:
    """
    For each trading date (Jan 1-31, 2026), delivery date is trading_date + 1 day (Jan 2 - Feb 1, 2026).
    For each delivery hour (24 hours on delivery date):
      Find the most recent WINDFOR forecast published at or before cutoff_utc on the trading date.
      Includes eligible previous-evening snapshots up to lookback_hours (default 48h) before cutoff.
      Strictly forbids any snapshot with publishTime > cutoff_utc.
    """
    if windfor_df.empty:
        return pd.DataFrame()

    df = windfor_df.copy()
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    if trading_dates is None:
        trading_dates = pd.date_range("2026-01-01", "2026-01-31", freq="D")

    records = []
    for t_dt in trading_dates:
        t_date = t_dt.date()
        deliv_date = t_date + timedelta(days=1)
        cutoff_utc = get_da_cutoff_utc(t_date, cutoff_local)
        window_start = cutoff_utc - timedelta(hours=lookback_hours)

        deliv_start = datetime(deliv_date.year, deliv_date.month, deliv_date.day, 0, 0, tzinfo=timezone.utc)
        deliv_end = deliv_start + timedelta(days=1)

        mask = (
            (df["startTime"] >= deliv_start) &
            (df["startTime"] < deliv_end) &
            (df["publishTime"] >= window_start) &
            (df["publishTime"] <= cutoff_utc)
        )
        eligible = df[mask]

        if eligible.empty:
            logger.warning(f"No eligible forecast found for trading {t_date} (delivery {deliv_date})")
            for h in range(24):
                st = deliv_start + timedelta(hours=h)
                records.append({
                    "trading_date": t_date.isoformat(),
                    "delivery_date": deliv_date.isoformat(),
                    "cutoff_utc": cutoff_utc.isoformat(),
                    "startTime": st,
                    "forecast_mw": np.nan,
                    "forecast_publishTime": None,
                    "forecast_age_at_cutoff_minutes": np.nan,
                    "forecast_lead_time_hours": np.nan
                })
        else:
            # Group by startTime, take the latest publishTime snapshot
            latest = (
                eligible.sort_values("publishTime")
                .groupby("startTime", as_index=False)
                .last()
            )
            # Create a full 24-hour sequence in case any hour was missing from snapshot
            for h in range(24):
                st = deliv_start + timedelta(hours=h)
                match = latest[latest["startTime"] == st]
                if not match.empty:
                    row = match.iloc[0]
                    pub_time = row["publishTime"]
                    age_mins = (cutoff_utc - pub_time).total_seconds() / 60.0
                    lead_hours = (st - pub_time).total_seconds() / 3600.0
                    records.append({
                        "trading_date": t_date.isoformat(),
                        "delivery_date": deliv_date.isoformat(),
                        "cutoff_utc": cutoff_utc.isoformat(),
                        "startTime": st,
                        "forecast_mw": float(row["generation"]),
                        "forecast_publishTime": pub_time.isoformat(),
                        "forecast_age_at_cutoff_minutes": round(age_mins, 1),
                        "forecast_lead_time_hours": round(lead_hours, 1)
                    })
                else:
                    records.append({
                        "trading_date": t_date.isoformat(),
                        "delivery_date": deliv_date.isoformat(),
                        "cutoff_utc": cutoff_utc.isoformat(),
                        "startTime": st,
                        "forecast_mw": np.nan,
                        "forecast_publishTime": None,
                        "forecast_age_at_cutoff_minutes": np.nan,
                        "forecast_lead_time_hours": np.nan
                    })

    return pd.DataFrame(records)


def build_joined_dataset(
    fuelhh_df: pd.DataFrame,
    windfor_df: pd.DataFrame,
    cutoff_local: str = "09:50"
) -> pd.DataFrame:
    """
    Generate the complete paired dataset for trading dates Jan 1-31, 2026 (delivery Jan 2 - Feb 1, 2026).
    Produces 744 hourly intervals with:
      - startTime (UTC)
      - trading_date, delivery_date, cutoff_utc
      - actual_mw, sp_count
      - forecast_mw, forecast_publishTime, forecast_age_at_cutoff_minutes, forecast_lead_time_hours
      - error_mw (forecast_mw - actual_mw)
    """
    deliv_start = datetime(2026, 1, 2, 0, 0, tzinfo=timezone.utc)
    deliv_end = datetime(2026, 2, 1, 23, 30, tzinfo=timezone.utc)
    hourly_actual = resample_fuelhh_to_hourly(fuelhh_df, start_utc=deliv_start, end_utc=deliv_end)
    da_forecasts = extract_da_forecasts(windfor_df, cutoff_local=cutoff_local)

    if da_forecasts.empty:
        return pd.DataFrame()

    joined = pd.merge(hourly_actual, da_forecasts, on="startTime", how="right")
    joined["error_mw"] = joined["forecast_mw"] - joined["actual_mw"]
    joined = joined.sort_values("startTime").reset_index(drop=True)
    return joined
