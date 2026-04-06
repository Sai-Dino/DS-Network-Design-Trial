"""
OSRM Local Setup & Road Distance Calculator
=============================================

STEP 1: SET UP OSRM LOCALLY (run these commands in your terminal)
-----------------------------------------------------------------

# 1. Pull the OSRM Docker image
docker pull osrm/osrm-backend

# 2. Create a directory for map data
mkdir -p ~/osrm-data && cd ~/osrm-data

# 3. Download India map from OpenStreetMap (~500MB download, may take a few minutes)
wget https://download.geofabrik.de/asia/india-latest.osm.pbf

# 4. Pre-process the map data (these 3 steps take ~10-30 min depending on your machine)

# Extract
docker run -t -v ~/osrm-data:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf

# Partition
docker run -t -v ~/osrm-data:/data osrm/osrm-backend osrm-partition /data/india-latest.osrm

# Customize
docker run -t -v ~/osrm-data:/data osrm/osrm-backend osrm-customize /data/india-latest.osrm

# 5. Start the OSRM routing server on port 5000
docker run -t -d -p 5000:5000 -v ~/osrm-data:/data osrm/osrm-backend osrm-routed --algorithm mld /data/india-latest.osrm

# 6. Verify it's running — open http://localhost:5000 in your browser
#    You should see a JSON response like {"status":200, ...}


STEP 2: RUN THIS SCRIPT
------------------------
Once OSRM is running locally, run this script:

    python osrm_setup_and_run.py --input your_orders.csv --output orders_with_distance.csv

"""

import pandas as pd
import requests
import time
import argparse
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm


# ─── Configuration ───────────────────────────────────────────────────────────
OSRM_BASE_URL = "http://localhost:5000"
MAX_WORKERS = 10          # parallel threads (local OSRM handles this well)
RETRY_COUNT = 3           # retries per failed request
TIMEOUT_SECONDS = 10      # request timeout


def get_road_distance(store_lat, store_lon, cust_lat, cust_lon):
    """
    Query local OSRM for the shortest road distance between two points.
    Returns distance in kilometers, or None if the route can't be found.
    """
    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/"
        f"{store_lon},{store_lat};{cust_lon},{cust_lat}"
        f"?overview=false"
    )

    for attempt in range(RETRY_COUNT):
        try:
            resp = requests.get(url, timeout=TIMEOUT_SECONDS)
            data = resp.json()

            if data.get("code") == "Ok" and data.get("routes"):
                distance_meters = data["routes"][0]["distance"]
                return round(distance_meters / 1000, 2)  # convert to km
            else:
                return None

        except (requests.RequestException, ValueError) as e:
            if attempt < RETRY_COUNT - 1:
                time.sleep(0.5)
            else:
                return None

    return None


def process_row(row, store_lat_col, store_lon_col, cust_lat_col, cust_lon_col):
    """Process a single row and return the road distance."""
    try:
        store_lat = float(row[store_lat_col])
        store_lon = float(row[store_lon_col])
        cust_lat = float(row[cust_lat_col])
        cust_lon = float(row[cust_lon_col])

        # Basic validation
        if not (-90 <= store_lat <= 90 and -180 <= store_lon <= 180):
            return None
        if not (-90 <= cust_lat <= 90 and -180 <= cust_lon <= 180):
            return None

        return get_road_distance(store_lat, store_lon, cust_lat, cust_lon)

    except (ValueError, TypeError):
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Calculate road distances using local OSRM"
    )
    parser.add_argument(
        "--input", "-i", required=True,
        help="Path to input CSV file"
    )
    parser.add_argument(
        "--output", "-o", default="orders_with_road_distance.csv",
        help="Path to output CSV file (default: orders_with_road_distance.csv)"
    )
    parser.add_argument(
        "--store-lat", default=None,
        help="Column name for store latitude"
    )
    parser.add_argument(
        "--store-lon", default=None,
        help="Column name for store longitude"
    )
    parser.add_argument(
        "--cust-lat", default=None,
        help="Column name for customer latitude"
    )
    parser.add_argument(
        "--cust-lon", default=None,
        help="Column name for customer longitude"
    )
    parser.add_argument(
        "--workers", type=int, default=MAX_WORKERS,
        help=f"Number of parallel workers (default: {MAX_WORKERS})"
    )

    args = parser.parse_args()

    # ─── Load CSV ────────────────────────────────────────────────────────
    print(f"\nLoading {args.input}...")
    df = pd.read_csv(args.input)
    print(f"Loaded {len(df):,} rows with columns: {list(df.columns)}\n")

    # ─── Auto-detect or use provided column names ────────────────────────
    cols_lower = {c.lower().strip(): c for c in df.columns}

    def find_col(provided, keywords):
        if provided and provided in df.columns:
            return provided
        for kw in keywords:
            for cl, original in cols_lower.items():
                if kw in cl:
                    return original
        return None

    store_lat_col = find_col(args.store_lat, ["lat store", "store_lat", "store lat", "origin_lat", "origin lat", "src_lat", "warehouse_lat", "hub_lat"])
    store_lon_col = find_col(args.store_lon, ["long store", "store_lon", "store_lng", "store lon", "origin_lon", "origin_lng", "src_lon", "warehouse_lon", "hub_lon"])
    cust_lat_col = find_col(args.cust_lat, ["lat order", "cust_lat", "customer_lat", "cust lat", "dest_lat", "destination_lat", "delivery_lat", "drop_lat"])
    cust_lon_col = find_col(args.cust_lon, ["long order", "cust_lon", "cust_lng", "customer_lon", "customer_lng", "dest_lon", "destination_lon", "delivery_lon", "drop_lon"])

    # ─── Prompt user if columns not found ────────────────────────────────
    missing = []
    if not store_lat_col: missing.append("store latitude")
    if not store_lon_col: missing.append("store longitude")
    if not cust_lat_col: missing.append("customer latitude")
    if not cust_lon_col: missing.append("customer longitude")

    if missing:
        print(f"Could not auto-detect columns for: {', '.join(missing)}")
        print(f"Available columns: {list(df.columns)}")
        print("\nPlease re-run with explicit column names:")
        print(f'  python {sys.argv[0]} -i {args.input} --store-lat "COL" --store-lon "COL" --cust-lat "COL" --cust-lon "COL"')
        sys.exit(1)

    print(f"Using columns:")
    print(f"  Store:    lat={store_lat_col}, lon={store_lon_col}")
    print(f"  Customer: lat={cust_lat_col}, lon={cust_lon_col}")

    # ─── Check OSRM is running ───────────────────────────────────────────
    try:
        health = requests.get(f"{OSRM_BASE_URL}", timeout=5)
        print(f"\nOSRM server is running at {OSRM_BASE_URL}")
    except requests.ConnectionError:
        print(f"\nERROR: Cannot connect to OSRM at {OSRM_BASE_URL}")
        print("Make sure the OSRM Docker container is running:")
        print("  docker run -t -d -p 5000:5000 -v ~/osrm-data:/data osrm/osrm-backend osrm-routed --algorithm mld /data/india-latest.osrm")
        sys.exit(1)

    # ─── Calculate distances in parallel ─────────────────────────────────
    print(f"\nCalculating road distances for {len(df):,} orders using {args.workers} workers...\n")

    distances = [None] * len(df)

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {}
        for idx, row in df.iterrows():
            future = executor.submit(
                process_row, row,
                store_lat_col, store_lon_col,
                cust_lat_col, cust_lon_col
            )
            futures[future] = idx

        with tqdm(total=len(df), desc="Processing", unit="orders") as pbar:
            for future in as_completed(futures):
                idx = futures[future]
                try:
                    distances[idx] = future.result()
                except Exception:
                    distances[idx] = None
                pbar.update(1)

    # ─── Save results ────────────────────────────────────────────────────
    df["road_distance_km"] = distances

    success = df["road_distance_km"].notna().sum()
    failed = df["road_distance_km"].isna().sum()

    print(f"\nResults:")
    print(f"  Successful: {success:,} ({success/len(df)*100:.1f}%)")
    print(f"  Failed:     {failed:,} ({failed/len(df)*100:.1f}%)")
    print(f"  Avg distance: {df['road_distance_km'].mean():.1f} km")
    print(f"  Max distance: {df['road_distance_km'].max():.1f} km")
    print(f"  Min distance: {df['road_distance_km'].min():.1f} km")

    df.to_csv(args.output, index=False)
    print(f"\nSaved to: {args.output}")


if __name__ == "__main__":
    main()
