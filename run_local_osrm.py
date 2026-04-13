"""
Local OSRM Road Distance Calculator
Uses locally installed OSRM (via Homebrew) for blazing fast calculations.

Usage:
    # Terminal 1: Start OSRM server (if not already running)
    cd ~/osrm-data
    osrm-routed --algorithm mld india-latest.osrm --port 5000

    # Terminal 2: Run this script
    python3 run_local_osrm.py
"""

import pandas as pd
import requests
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# ─── Configuration ───────────────────────────────────────────────────────────
INPUT_FILE = "21feb_distance_input.csv"
OUTPUT_FILE = "21feb_orders_with_road_distance.csv"
OSRM_BASE = "http://localhost:5000"
BATCH_SIZE = 50
MAX_WORKERS = 10
RETRY_COUNT = 3
TIMEOUT = 10


def get_batch_distances(store_lat, store_lon, customer_coords):
    """Use OSRM Table API: one store -> many customers in one request."""
    coords = f"{store_lon},{store_lat}"
    for clat, clon in customer_coords:
        coords += f";{clon},{clat}"

    destinations = ";".join(str(i) for i in range(1, len(customer_coords) + 1))
    url = f"{OSRM_BASE}/table/v1/driving/{coords}?sources=0&destinations={destinations}&annotations=distance"

    for attempt in range(RETRY_COUNT):
        try:
            resp = requests.get(url, timeout=TIMEOUT)
            data = resp.json()
            if data.get("code") == "Ok":
                return [round(d / 1000, 2) if d is not None else None for d in data["distances"][0]]
            else:
                return fallback_individual(store_lat, store_lon, customer_coords)
        except Exception:
            if attempt < RETRY_COUNT - 1:
                time.sleep(0.5)
            else:
                return [None] * len(customer_coords)
    return [None] * len(customer_coords)


def fallback_individual(store_lat, store_lon, customer_coords):
    """Fallback: individual route queries if table API fails."""
    results = []
    for clat, clon in customer_coords:
        url = f"{OSRM_BASE}/route/v1/driving/{store_lon},{store_lat};{clon},{clat}?overview=false"
        try:
            resp = requests.get(url, timeout=TIMEOUT)
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                results.append(round(data["routes"][0]["distance"] / 1000, 2))
            else:
                results.append(None)
        except Exception:
            results.append(None)
    return results


def main():
    print(f"\nLoading {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)
    print(f"Loaded {len(df):,} orders from {df['Dark store'].nunique()} stores")

    # Check OSRM server
    try:
        test = requests.get(f"{OSRM_BASE}/route/v1/driving/77.5946,12.9716;77.6200,13.0000?overview=false", timeout=5)
        if test.json().get("code") == "Ok":
            print("OSRM server is running!\n")
        else:
            print("OSRM server responded but route failed.")
            sys.exit(1)
    except Exception:
        print(f"\nERROR: Cannot connect to OSRM at {OSRM_BASE}")
        print("Start the server first:")
        print("  cd ~/osrm-data")
        print("  osrm-routed --algorithm mld india-latest.osrm --port 5000")
        sys.exit(1)

    # Process by store using Table API
    store_groups = df.groupby("Dark store")
    distances = {}

    pbar = tqdm(total=len(df), desc="Calculating distances", unit="orders")

    for store_name, group in store_groups:
        store_lat = group["Lat Store"].iloc[0]
        store_lon = group["Long Store"].iloc[0]

        order_ids = group["Order ID"].astype(str).tolist()
        cust_lats = group["Lat Order"].tolist()
        cust_lons = group["Long Order"].tolist()

        for i in range(0, len(order_ids), BATCH_SIZE):
            batch_ids = order_ids[i:i + BATCH_SIZE]
            batch_coords = list(zip(cust_lats[i:i + BATCH_SIZE], cust_lons[i:i + BATCH_SIZE]))

            batch_distances = get_batch_distances(store_lat, store_lon, batch_coords)

            for oid, dist in zip(batch_ids, batch_distances):
                distances[str(oid)] = dist

            pbar.update(len(batch_ids))

    pbar.close()

    # Save results
    df["road_distance_km"] = df["Order ID"].astype(str).map(lambda oid: distances.get(str(oid)))

    success = df["road_distance_km"].notna().sum()
    failed = df["road_distance_km"].isna().sum()
    valid = df["road_distance_km"].dropna()

    print(f"\n{'='*50}")
    print(f"RESULTS")
    print(f"{'='*50}")
    print(f"  Successful:    {success:,} ({success/len(df)*100:.1f}%)")
    print(f"  Failed:        {failed:,} ({failed/len(df)*100:.1f}%)")
    if len(valid) > 0:
        print(f"  Avg distance:  {valid.mean():.1f} km")
        print(f"  Max distance:  {valid.max():.1f} km")
        print(f"  Min distance:  {valid.min():.1f} km")
        print(f"  Median:        {valid.median():.1f} km")

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved to: {OUTPUT_FILE}")
    print("Done!\n")


if __name__ == "__main__":
    main()
