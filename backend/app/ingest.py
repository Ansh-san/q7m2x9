import os
import logging
from pathlib import Path
from datetime import datetime, timezone
import httpx
import pandas as pd

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

FUELHH_CACHE = DATA_DIR / "fuelhh_wind_jan2026.parquet"
WINDFOR_CACHE = DATA_DIR / "windfor_jan2026.parquet"

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

async def fetch_fuelhh_data(force_refresh: bool = False) -> pd.DataFrame:
    """
    Fetch FUELHH actual wind generation from BMRS API.
    Covers settlement dates 2026-01-01 through 2026-02-02 to cover
    all delivery hours for trading decisions made in January 2026 (Jan 2 to Feb 1 delivery).
    """
    if not force_refresh and FUELHH_CACHE.exists():
        logger.info(f"Loading FUELHH from cache: {FUELHH_CACHE}")
        return pd.read_parquet(FUELHH_CACHE)

    url = (
        f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
        "?fuelType=WIND"
        "&settlementDateFrom=2026-01-01"
        "&settlementDateTo=2026-02-02"
        "&format=json"
    )
    logger.info(f"Fetching FUELHH from BMRS: {url}")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        records = resp.json()

    df = pd.DataFrame(records)
    if not df.empty:
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        if "settlementDate" in df.columns:
            df["settlementDate"] = pd.to_datetime(df["settlementDate"]).dt.date
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
        df.to_parquet(FUELHH_CACHE, index=False)
        logger.info(f"Cached {len(df)} FUELHH records to {FUELHH_CACHE}")
    return df


async def fetch_windfor_data(force_refresh: bool = False) -> pd.DataFrame:
    """
    Fetch WINDFOR forecast snapshots from BMRS API.
    Retrieval window:
      publishDateTimeFrom = 2025-12-30T00:00:00Z (safe lower bound before earliest Dec 31/Jan 1 forecast)
      publishDateTimeTo   = 2026-01-31T09:50:00Z (last cutoff for Jan 31 trading day)
    """
    if not force_refresh and WINDFOR_CACHE.exists():
        logger.info(f"Loading WINDFOR from cache: {WINDFOR_CACHE}")
        return pd.read_parquet(WINDFOR_CACHE)

    url = (
        f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"
        "?publishDateTimeFrom=2025-12-30T00:00:00Z"
        "&publishDateTimeTo=2026-01-31T09:50:00Z"
        "&format=json"
    )
    logger.info(f"Fetching WINDFOR from BMRS: {url}")
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        records = resp.json()

    df = pd.DataFrame(records)
    if not df.empty:
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
        df.to_parquet(WINDFOR_CACHE, index=False)
        logger.info(f"Cached {len(df)} WINDFOR records to {WINDFOR_CACHE}")
    return df
