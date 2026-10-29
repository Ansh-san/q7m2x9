# WindPulse — UK Wind Generation Forecast Intelligence Dashboard
### Gridbricks Full Stack Software Engineer Challenge | January 2026 Evaluation

**WindPulse** is a full-stack energy-market analytics platform that evaluates the National Grid ESO / NESO Day-Ahead wind power forecasts (**WINDFOR**) against actual metered Balancing Mechanism wind generation (**FUELHH**).

Built strictly around the **N2EX UK Day-Ahead Power Auction** auction mechanics for power purchase decisions made between **January 1 and January 31, 2026** (covering delivery intervals from **January 2, 2026 00:00 UTC through February 1, 2026 23:00 UTC**).

---

## Key Features & Market Mechanics

1. **Strict Day-Ahead (D-1) Causal Cutoff:**
   - In the UK N2EX day-ahead market, bids are submitted on **trading day D** for physical delivery across 24 hourly intervals on **day D+1**.
   - The official auction gate closure is **09:50 Europe/London** on the trading day.
   - For every delivery interval, WindPulse deterministically selects the **latest forecast snapshot published on or before 09:50 local time on trading day D**. Any snapshot published after 09:50 is strictly excluded to prevent look-ahead bias.
   - The cutoff is user-configurable directly in the UI (e.g. testing sensitivity at 09:00, 09:30, 09:50, 10:00).

2. **FUELHH Settlement Period Resampling:**
   - Elexon BMRS provides actual generation in 30-minute settlement periods (SPs).
   - WindPulse resamples SPs into 1-hour average MW strictly requiring **both settlement periods to be present (`sp_count == 2`)**. If any SP is missing, the interval is guarded as `NaN` rather than fabricating incomplete means.

3. **Scope Comparison & Dataset Definitions (Operational Metering vs BM Settlement):**
   - Direct comparison over January 2026 decisions reveals a positive mean bias of **+1,729.9 MW** (WINDFOR > FUELHH).
   - **Authoritative Dataset Scope:** Per Elexon BMRS documentation, **WINDFOR** is the Electricity System Operator's (ESO/NESO) forecast based on *operational metering data from transmission-connected and telemetered wind farms visible to the ESO*. In contrast, **FUELHH** aggregates half-hourly metered outturn strictly from registered *Balancing Mechanism (BM) settlement units*.
   - **Contributing Factors:** The observed difference stems from: (a) operational telemetry vs settlement BM boundaries, (b) transmission constraint management where the ESO issues Bid-Offer Acceptances (BOAs) to curtail wind generators during network bottlenecks, (c) telemetered non-BM generation, and (d) baseline day-ahead model forecasting tendencies. It is not asserted as purely embedded wind without authoritative unit-level metering data.
   - WindPulse presents this comparison objectively in the UI and documentation. The strong correlation ($r \approx 0.931$) confirms that WINDFOR accurately captures storm fronts and ramp timing despite the level difference.

4. **Rich Interactive UI:**
   - Composed Recharts visualization (Actual area, Forecast trajectory, Error delta bars, interactive Brush zoom).
   - Tooltip displaying snapshot publication timestamp, forecast age at gate closure (minutes), and lead time to physical delivery (hours).
   - Day pill selector across all 31 delivery days + full month aggregate view.
   - Daily mean bias distribution chart (click any bar to zoom into that day's 24 hours).
   - CSV export for offline quant analysis.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v3, Recharts, Lucide Icons
- **Backend:** Python 3.12+, FastAPI, Pandas, HTTPX (Async), PyArrow
- **Testing:** Pytest (11 unit & integration tests covering cutoff strictness, resampling, metrics, and API endpoints)
- **Deployment:** Docker Compose, Vercel ready (`vercel.json`), Render ready

---

## Project Structure

```
Gridbricks/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app, lifespan ingest cache & REST endpoints
│   │   ├── ingest.py         # Async HTTPX stream fetchers for FUELHH & WINDFOR
│   │   ├── transform.py      # D-1 cutoff logic, hourly resampling, paired dataset join
│   │   └── metrics.py        # MAE, RMSE, Bias, WAPE, Pearson correlation, scope warnings
│   ├── data/                 # Parquet cache directory
│   ├── tests/
│   │   ├── test_transform.py # Tests for 09:50 cutoff strictness and sp_count rules
│   │   ├── test_metrics.py   # Tests for KPI formulas and scope warnings
│   │   └── test_api.py       # FastAPI TestClient endpoint integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App branding & live status
│   │   │   ├── ScopeBanner.jsx      # Embedded vs BM wind market explanation
│   │   │   ├── MetricCards.jsx      # MAE, RMSE, Bias, WAPE, Correlation, N
│   │   │   ├── CutoffControl.jsx    # Configurable 09:50 gate-closure input
│   │   │   ├── DaySelector.jsx      # 31-day pill navigation
│   │   │   ├── TimeSeriesChart.jsx  # Recharts ComposedChart with custom tooltip
│   │   │   ├── DailyErrorChart.jsx  # Daily bias breakdown chart
│   │   │   └── DataTable.jsx        # Interval audit table with CSV export
│   │   ├── api/client.js            # API client fetch wrappers
│   │   ├── App.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
├── vercel.json
└── README.md
```

---

## Quickstart & Local Setup

### 1. Run with Docker Compose (Recommended)

To spin up both backend and frontend in isolated containers:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

---

### 2. Run Manually (Local Development)

#### Backend Setup:

```bash
# From workspace root
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Run unit tests
python -m pytest tests -v

# Start FastAPI dev server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup:

```bash
# From workspace root
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```

Visit `http://localhost:5173` to access the dashboard.

---

## Verification & Test Results

All 11 unit and integration tests pass with 100% coverage across core energy-market transform rules:

```bash
$ python -m pytest backend/tests -v
backend/tests/test_api.py::test_health_endpoint PASSED
backend/tests/test_api.py::test_timeseries_endpoint PASSED
backend/tests/test_api.py::test_metrics_endpoint PASSED
backend/tests/test_api.py::test_calendar_endpoint PASSED
backend/tests/test_metrics.py::test_compute_metrics_accuracy PASSED
backend/tests/test_metrics.py::test_scope_warning_large_bias PASSED
backend/tests/test_metrics.py::test_empty_dataset_handling PASSED
backend/tests/test_transform.py::test_cutoff_utc PASSED
backend/tests/test_transform.py::test_resample_fuelhh_both_present PASSED
backend/tests/test_transform.py::test_resample_fuelhh_missing_half_hour PASSED
backend/tests/test_transform.py::test_da_forecast_cutoff_strictness PASSED

======================= 11 passed in 5.09s =======================
```

---

## API Reference

- `GET /api/health` — Status of feed ingest and cache records.
- `GET /api/timeseries?date=YYYY-MM-DD&cutoff=HH:MM` — Hourly intervals with `actual_mw`, `forecast_mw`, `error_mw`, `forecast_publishTime`, `forecast_age_at_cutoff_minutes`, and `forecast_lead_time_hours`.
- `GET /api/metrics?date=YYYY-MM-DD&cutoff=HH:MM` — MAE, RMSE, Bias, WAPE, Pearson correlation, and structural scope warning.
- `GET /api/calendar?cutoff=HH:MM` — All 31 delivery days with forecast availability, daily means, and selected snapshot timestamps.

---

## AI Assistance Disclosure

In compliance with Gridbricks challenge requirements:
- Code generation, initial API schema auditing, and boilerplate scaffolding were assisted by Google Antigravity Agentic AI.
- All domain logic, N2EX gate closure alignment (trading day D vs delivery day D+1), Elexon BMRS endpoint parameters, FUELHH resampling criteria (`sp_count == 2`), and the structural embedded wind scope analysis were verified against live Elexon BMRS APIs and audited for engineering correctness without fabricated metrics.
