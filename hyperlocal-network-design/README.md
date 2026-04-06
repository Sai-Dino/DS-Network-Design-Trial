# Hyperlocal Network Design Tool

A network design and analysis tool for Flipkart's hyperlocal delivery operations. Calculates and visualizes road distances between dark stores and customer order locations to ensure every delivery stays within a configurable threshold (default: 3 km).

## What It Does

- **Upload** order data as CSV/XLSX (with or without pre-calculated distances)
- **Calculate** shortest road distances via OSRM (Open Source Routing Machine)
- **Analyze** network coverage, identify problem stores, and spot service gaps
- **Visualize** stores and orders on an interactive map with coverage circles
- **Export** results as CSV for further analysis

## Quick Start

### Prerequisites

- Python 3.9+
- OSRM with India map data (only needed for distance calculation; skip if uploading pre-calculated files)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the App

```bash
python3 server.py
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### 3. (Optional) Set Up OSRM for Distance Calculation

If you need to calculate road distances from scratch (i.e., your data doesn't already have a distance column):

```bash
# Install OSRM (macOS)
brew install osrm-backend

# Download and prepare India map data (~500MB download)
make osrm-setup

# Start the OSRM server
make osrm-start
```

This runs OSRM on `localhost:5000`. The app connects to it automatically.

## Input Data Format

Your CSV/XLSX needs these columns (names are auto-detected):

| Column | Example Names |
|--------|--------------|
| Store ID | `Dark store`, `store_id`, `hub_id` |
| Order ID | `Order ID`, `order_id`, `consignment_id` |
| Store Latitude | `Lat Store`, `store_lat`, `hub_lat` |
| Store Longitude | `Long Store`, `store_lon`, `hub_lon` |
| Order Latitude | `Lat Order`, `order_lat`, `dest_lat` |
| Order Longitude | `Long Order`, `order_lon`, `dest_lon` |
| Distance (optional) | `road_distance_km`, `distance_km`, `distance` |

If a distance column is present, the tool skips OSRM calculation and loads results directly.

## Features

### Dashboard
- Configurable delivery radius threshold
- Network health score and coverage percentage
- Per-store breach analysis (problem/critical store identification)
- Auto-generated insights and recommendations
- Distribution histogram and store-level charts

### Map View
- Dark stores shown as labeled markers with coverage radius circles
- Orders color-coded: green (within threshold) / red (breach)
- Filter by store, show breach-only or within-only orders
- Toggle coverage circles on/off

### Data Table
- Sortable, filterable, paginated view of all orders
- Filter by store, distance range, or search by ID
- Export filtered or full results as CSV

## Project Structure

```
hyperlocal-network-design/
├── server.py              # Flask backend (API + OSRM integration)
├── static/
│   └── index.html         # Frontend (single-file HTML/CSS/JS)
├── scripts/
│   ├── setup_osrm.sh      # OSRM data download and preparation
│   ├── start_osrm.sh      # Start OSRM routing server
│   └── start_app.sh       # Start the application
├── data/                   # Place your CSV/XLSX files here (gitignored)
├── requirements.txt
├── Makefile
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve frontend |
| `POST` | `/api/upload` | Upload CSV/XLSX file |
| `POST` | `/api/calculate/<job_id>` | Start OSRM distance calculation |
| `GET` | `/api/progress/<job_id>` | Poll calculation progress |
| `GET` | `/api/stats/<job_id>` | Get job statistics |
| `GET` | `/api/network-analysis/<job_id>` | Threshold-based network analysis |
| `GET` | `/api/map/<job_id>` | Map data (stores + sampled orders) |
| `GET` | `/api/table/<job_id>` | Paginated, filterable table data |
| `GET` | `/api/download/<job_id>` | Download results as CSV |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/test-osrm` | Test OSRM connectivity |

## Configuration

Environment variables / defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `8080` | Application server port |
| `OSRM_PORT` | `5000` | OSRM server port |
| `OSRM_DATA_DIR` | `~/osrm-data` | OSRM map data directory |

## Performance

- **OSRM calculation**: ~650 requests/sec with 24 parallel workers
- **Pre-calculated files**: 3.38M rows loads in ~5 seconds
- **Max file size**: 500 MB
