# WindPulse — UK Wind Generation Forecast Intelligence

**Gridbricks | Full Stack Software Engineer Intern — Hiring Challenge**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://q7m2x9-nrok.vercel.app/)
[![Backend](https://img.shields.io/badge/API-Render-purple)](https://q7m2x9.onrender.com/)
[![Python](https://img.shields.io/badge/Python-FastAPI-blue?logo=python)](https://fastapi.tiangolo.com/)

## Live Deployment

- **Application:** https://q7m2x9-nrok.vercel.app/
- **Backend API:** https://q7m2x9.onrender.com/
- **API Documentation:** https://q7m2x9.onrender.com/docs
- **Health Check:** https://q7m2x9.onrender.com/api/health

## 1. Overview

WindPulse is a full-stack energy analytics dashboard designed to help a UK electricity utility evaluate day-ahead wind generation forecasts against actual metered wind generation.

The application uses historical data from Elexon BMRS and reconstructs the forecast information available at the time of the day-ahead purchasing decision.

**Evaluation period:** January 1–31, 2026 (trading decisions).

**Delivery period:** January 2–February 1, 2026.

**Total expected delivery intervals:** 744 hourly intervals.

## 2. Key Features

### Day-Ahead Forecast Reconstruction
- Configurable N2EX day-ahead cutoff, defaulting to 09:50 Europe/London.
- Maps trading day D to physical delivery day D+1.
- Selects the latest eligible forecast published at or before the trading-day cutoff.
- Rejects forecasts published after the cutoff to prevent look-ahead bias.
- Displays forecast publication time, forecast age at gate closure and lead time to delivery.

### Actual Generation Processing
- Retrieves FUELHH actual wind generation.
- Converts 30-minute settlement periods into hourly average MW.
- Requires both half-hourly readings to be present (`sp_count == 2`).
- Flags incomplete intervals rather than using partial averages.

### Forecast Accuracy Analysis
The dashboard calculates:

- **MAE:** Mean Absolute Error, in MW.
- **RMSE:** Root Mean Squared Error, in MW.
- **Bias:** Mean Forecast minus Actual, in MW.
- **WAPE:** Weighted Absolute Percentage Error.
- **Pearson Correlation:** Measures the relationship between forecast and actual generation profiles.

### Interactive Analytics
- Forecast versus actual generation time-series chart.
- Daily mean bias and error analysis.
- Delivery-date selector covering all 31 trading decisions.
- Configurable gate-closure time.
- Forecast publication and interval-level audit table.
- CSV export for further analysis.

## 3. Data Sources

All analysis is restricted to the two Elexon datasets specified in the challenge.

| Dataset | Purpose | Relevant Fields |
|---|---|---|
| FUELHH | Actual half-hourly generation | `fuelType`, `startTime`, `generation` |
| WINDFOR | Wind generation forecasts | `startTime`, `publishTime`, `generation` |

Official Elexon documentation:

- [FUELHH API](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
- [WINDFOR API](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)

## 4. Forecast Selection and Processing Logic

For each trading date D in January 2026:

1. Calculate the day-ahead gate closure using 09:50 Europe/London.
2. Identify delivery date D+1.
3. Retrieve eligible WINDFOR forecast snapshots for the delivery intervals.
4. Select the latest `publishTime` not exceeding the trading-day cutoff for each delivery interval.
5. Resample the corresponding FUELHH actual readings from 30-minute to hourly resolution.
6. Require two complete settlement-period readings for each hourly actual.
7. Join forecast and actual values using their hourly `startTime`.
8. Calculate forecast errors and aggregate accuracy metrics.

The processing pipeline enforces a causal publication-time constraint: forecasts published after the decision cutoff cannot influence the reconstructed day-ahead forecast.

## 5. Important Dataset Limitations

WINDFOR and FUELHH have different measurement and reporting definitions.

WINDFOR represents the system operator's wind-generation forecast based on operational metering, while FUELHH represents actual generation associated with registered Balancing Mechanism settlement units.

Consequently, differences between the two series should not automatically be interpreted as pure forecasting-model error.

The application makes this distinction visible in the dashboard. The observed comparison is useful for examining generation profiles, but the two datasets alone cannot isolate every source of measurement, metering or operational difference.

**Procurement limitation:** Consumer demand data is outside the challenge scope. WindPulse therefore evaluates wind generation forecasts but does not calculate the utility's complete residual electricity procurement requirement.

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide |
| Backend | Python, FastAPI |
| Data Processing | Pandas, NumPy |
| HTTP Client | HTTPX |
| Data Cache | Parquet, PyArrow |
| Testing | Pytest |
| Containerization | Docker, Docker Compose |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

## 7. Project Structure

```text
q7m2x9/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── ingest.py
│   │   ├── transform.py
│   │   └── metrics.py
│   ├── data/
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_metrics.py
│   │   └── test_transform.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── vercel.json
├── .gitignore
└── README.md
```

## 8. Running the Application Locally

### Option A: Docker Compose (Recommended)

Requirements: Docker Desktop with Docker Compose.

Clone the repository:

```bash
git clone https://github.com/Ansh-san/q7m2x9.git
cd q7m2x9
```

Build and start both services:

```bash
docker compose up --build
```

Local URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API documentation: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### Option B: Manual Development Setup

**Backend:**

```bash
cd backend

python -m venv .venv
```

Activate the environment and install dependencies:

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Run the tests:

```bash
python -m pytest tests -v
```

Start the backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**

Open a separate terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5173.

## 9. Backend API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Backend and data-cache health |
| `GET /api/timeseries?date=2026-01-15&cutoff=09:50` | Hourly forecast and actual generation |
| `GET /api/metrics?cutoff=09:50` | Aggregate forecast accuracy metrics |
| `GET /api/calendar?cutoff=09:50` | Delivery-day availability and snapshot information |

Interactive API documentation: https://q7m2x9.onrender.com/docs

## 10. Testing and Verification

The backend includes 11 unit and integration tests covering:

- London timezone and UTC cutoff conversion.
- FUELHH hourly resampling.
- Missing half-hour settlement periods.
- Forecast publication cutoff strictness.
- Accuracy metric calculations.
- Empty and incomplete datasets.
- FastAPI health, time-series, metrics and calendar endpoints.

The frontend production build was verified using:

```bash
npm run build
```

Docker Compose configuration was validated using:

```bash
docker compose config
```

## 11. AI Assistance Disclosure

AI tools were used during development, in accordance with the hiring challenge instructions.

- **Google Antigravity:** Assisted with application scaffolding, code generation, implementation, debugging and development workflow.
- **ChatGPT:** Assisted with requirement analysis, domain research, architecture planning, technical review, debugging guidance and documentation preparation.

AI-generated suggestions and code were reviewed and tested against the project requirements. Elexon BMRS was used as the specified external data source.

---

**Project:** WindPulse  
**Repository:** https://github.com/Ansh-san/q7m2x9  
**Live Application:** https://q7m2x9-nrok.vercel.app/  
**Backend:** https://q7m2x9.onrender.com/  
**Challenge:** Gridbricks Full Stack Software Engineer Intern
