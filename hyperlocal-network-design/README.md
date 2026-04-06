# Flipkart Hyperlocal Distance Analyzer

Analyze store-to-delivery distances at scale with OSRM integration. Upload a CSV with millions of orders, compute road distances, and get instant dashboards with coverage metrics, threshold analysis, and store-level insights.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                       │
│              static/index.html + Chart.js               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/JSON
┌───────────────────────▼─────────────────────────────────┐
│              Flask API (Gunicorn)                        │
│  app/routes/api.py  •  app/routes/health.py             │
├─────────────────────────────────────────────────────────┤
│              Services Layer                              │
│  app/services/stats.py  •  app/services/osrm.py         │
├──────────┬──────────────┬───────────────────────────────┤
│ PostgreSQL│    Redis     │        OSRM Server            │
│ (metadata)│  (task queue)│  (road distance engine)       │
└──────────┘──────────────┘───────────────────────────────┘
```

## Quick Start

### Option A: Docker (recommended)

```bash
cp .env.example .env          # Configure settings
docker compose up --build     # Start app + DB + Redis
```

Open http://localhost:8080

### Option B: Local development

```bash
# 1. Create virtual environment
python3 -m venv venv && source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
python run.py
```

Open http://localhost:8080

### Option C: Production (Gunicorn)

```bash
gunicorn -c gunicorn.conf.py 'app:create_app()'
```

## Project Structure

```
hyperlocal-network-design/
├── app/                        # Application package
│   ├── __init__.py             # App factory
│   ├── config.py               # Configuration (env vars)
│   ├── extensions.py           # Flask extensions (DB, migrations)
│   ├── models.py               # Database models (Job, AuditLog)
│   ├── routes/
│   │   ├── api.py              # All API endpoints
│   │   └── health.py           # Health check (/health)
│   ├── services/
│   │   ├── osrm.py             # OSRM integration + batch engine
│   │   └── stats.py            # Statistics computation
│   ├── tasks/
│   │   ├── celery_app.py       # Celery configuration
│   │   └── distance_tasks.py   # Async distance calculation tasks
│   └── utils/
│       ├── columns.py          # Column auto-detection
│       ├── geo.py              # Haversine distance
│       └── validation.py       # Input validation + SSRF protection
├── static/
│   └── index.html              # Frontend SPA
├── tests/                      # pytest test suite
│   ├── conftest.py             # Shared fixtures
│   ├── test_api.py             # API integration tests
│   ├── test_columns.py         # Column detection tests
│   ├── test_stats.py           # Statistics tests
│   └── test_validation.py      # Validation tests
├── .github/workflows/ci.yml   # CI/CD pipeline
├── Dockerfile                  # Container image
├── docker-compose.yml          # Full stack orchestration
├── gunicorn.conf.py            # Production server config
├── requirements.txt            # Python dependencies
├── run.py                      # Development entry point
├── server.py                   # Legacy monolith (kept as reference)
└── .env.example                # Environment variable template
```

## Configuration

All settings are driven by environment variables. See `.env.example` for the full list.

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | `development`, `production`, or `testing` |
| `APP_PORT` | `8080` | Server port |
| `DATABASE_URL` | `sqlite:///hyperlocal.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis for Celery |
| `OSRM_URL` | `http://localhost:5000` | Default OSRM server |
| `OSRM_ALLOWED_HOSTS` | `localhost,127.0.0.1` | SSRF protection allow-list |
| `AUTH_ENABLED` | `false` | Enable API authentication |
| `SECRET_KEY` | `change-me` | Flask secret key |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/upload` | Upload CSV/XLSX |
| `POST` | `/api/calculate/<job_id>` | Start OSRM calculation |
| `GET` | `/api/progress/<job_id>` | Poll job progress |
| `GET` | `/api/stats/<job_id>` | Get computed statistics |
| `GET` | `/api/network-analysis/<job_id>` | Threshold analysis |
| `GET` | `/api/stores/<job_id>` | Per-store metrics |
| `GET` | `/api/chart/daily/<job_id>` | Daily trend data |
| `GET` | `/api/map/<job_id>` | Map visualization data |
| `GET` | `/api/table/<job_id>` | Paginated results table |
| `GET` | `/api/download/<job_id>` | CSV export |
| `GET` | `/api/jobs` | List all jobs |
| `DELETE` | `/api/jobs/<job_id>` | Delete a job |

## Running Tests

```bash
pytest tests/ -v
```

## Running Celery Worker

```bash
celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
```

## OSRM Setup

```bash
# Download and prepare India map data
make osrm-setup

# Start OSRM server
make osrm-start
```

See `scripts/setup_osrm.sh` for details.
