"""
OSRM Road Distance Calculator (No Docker Required!)
====================================================
Uses the free public OSRM Table API with smart batching.
Groups orders by store, then batches customer lookups.

Usage:
    pip install pandas requests tqdm
    python osrm_distance_calculator.py
"""

import pandas as pd
import requests
import time
import json
import os
import sys
from tqdm import tqdm

# ─── Configuration ───────────────────────────────────────────────────────────
INPUT_FILE = "Copy of Distance calculator- Google maps Distance - Dis_Cal.csv"
OUTPUT_FILE = "orders_with_road_distance.csv"
PROGRESS_FILE = "distance_progress.json"  # auto-resume if interrupted

OSRM_BASE = "https://router.project-osrm.org"
BATCH_SIZE = 50        # customers per Table API request (public server limit)
DELAY_BETWEEN = 1.5    # seconds between requests (respectful rate limiting)
RETRY_COUNT = 3
TIMEOUT = 30


def get_batch_distances(store_lat, store_lon, customer_coords):
    """
    Use OSRM Table API to get distances from one store to multiple customers
    in a single request.

    Returns list of distances in km (or None for failed lookups).
    """
    # Build coordinate string: store first, then all customers
    coords = f"{store_lon},{store_lat}"
    for clat, clon in customer_coords:
        coords += f";{clon},{clat}"

    url = (
        f"{OSRM_BASE}/table/v1/driving/{coords}"
        f"?sources=0"                          # only from store (index 0)
        f"&destinations=" + ";".join(str(i) for i in range(1, len(customer_coords) + 1))
        + f"&annotations=distance"             # get distances in meters
    )

    for attempt in range(RETRY_COUNT):
        try:
            resp = requests.get(url, timeout=TIMEOUT)

            if resp.status_code == 429:  # rate limited
                wait = 5 * (attempt + 1)
                print(f"\n  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue

            data = resp.json()

            if data.get("code") == "Ok":
                # distances[0] = distances from store to each customer
                distances_m = data["distances"][0]
                return [
                    round(d / 1000, 2) if d is not None else None
                    for d in distances_m
                ]
            else:
                # Table API failed, fall back to individual route queries
                return fallback_individual(store_lat, store_lon, customer_coords)

        except (requests.RequestException, ValueError, KeyError) as e:
            if attempt < RETRY_COUNT - 1:
                time.sleep(2 * (attempt + 1))
            else:
                return [None] * len(customer_coords)

    return [None] * len(customer_coords)


def fallback_individual(store_lat, store_lon, customer_coords):
    """Fallback: query routes individually if table API fails for a batch."""
    results = []
    for clat, clon in customer_coords:
        url = (
            f"{OSRM_BASE}/route/v1/driving/"
            f"{store_lon},{store_lat};{clon},{clat}"
            f"?overview=false"
        )
        try:
            time.sleep(1)
            resp = requests.get(url, timeout=TIMEOUT)
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                dist_km = round(data["routes"][0]["distance"] / 1000, 2)
                results.append(dist_km)
            else:
                results.append(None)
        except Exception:
            results.append(None)
    return results


def load_progress():
    """Load progress from previous run (for auto-resume)."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {}


def save_progress(progress):
    """Save progress to disk."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)


def main():
    # ─── Load data ───────────────────────────────────────────────────────
    print(f"\nLoading {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)
    print(f"Loaded {len(df):,} orders from {df['Dark store'].nunique()} stores\n")

    # ─── Group by store ──────────────────────────────────────────────────
    store_groups = df.groupby("Dark store")

    # ─── Load any previous progress ──────────────────────────────────────
    progress = load_progress()
    distances = {}  # order_id -> distance

    # Restore completed distances
    for order_id, dist in progress.items():
        distances[order_id] = dist

    completed_stores = set()
    for store_name, group in store_groups:
        order_ids = group["Order ID"].astype(str).tolist()
        if all(str(oid) in progress for oid in order_ids):
            completed_stores.add(store_name)

    remaining_stores = [s for s in store_groups.groups.keys() if s not in completed_stores]
    total_remaining = sum(len(store_groups.get_group(s)) for s in remaining_stores)

    if completed_stores:
        print(f"Resuming: {len(completed_stores)} stores already done, {len(remaining_stores)} remaining ({total_remaining:,} orders)\n")

    # ─── Check OSRM server ──────────────────────────────────────────────
    print("Checking OSRM public server...")
    try:
        test = requests.get(
            f"{OSRM_BASE}/route/v1/driving/77.5946,12.9716;77.6200,13.0000?overview=false",
            timeout=10
        )
        if test.json().get("code") == "Ok":
            print("OSRM server is reachable!\n")
        else:
            print("WARNING: OSRM server responded but route failed. Proceeding anyway...\n")
    except Exception as e:
        print(f"ERROR: Cannot reach OSRM server: {e}")
        print("Check your internet connection and try again.")
        sys.exit(1)

    # ─── Process each store ──────────────────────────────────────────────
    total_batches = sum(
        (len(store_groups.get_group(s)) + BATCH_SIZE - 1) // BATCH_SIZE
        for s in remaining_stores
    )

    pbar = tqdm(total=total_remaining, desc="Calculating distances", unit="orders")
    batch_count = 0
    failed_count = 0

    for store_name in remaining_stores:
        group = store_groups.get_group(store_name)
        store_lat = group["Lat Store"].iloc[0]
        store_lon = group["Long Store"].iloc[0]

        order_ids = group["Order ID"].astype(str).tolist()
        cust_lats = group["Lat Order"].tolist()
        cust_lons = group["Long Order"].tolist()

        # Process in batches
        for i in range(0, len(order_ids), BATCH_SIZE):
            batch_ids = order_ids[i:i + BATCH_SIZE]
            batch_coords = list(zip(
                cust_lats[i:i + BATCH_SIZE],
                cust_lons[i:i + BATCH_SIZE]
            ))

            # Skip already-completed orders in this batch
            if all(str(oid) in distances for oid in batch_ids):
                pbar.update(len(batch_ids))
                continue

            # Query OSRM Table API
            batch_distances = get_batch_distances(store_lat, store_lon, batch_coords)

            # Store results
            for oid, dist in zip(batch_ids, batch_distances):
                distances[str(oid)] = dist
                if dist is None:
                    failed_count += 1

            pbar.update(len(batch_ids))
            batch_count += 1

            # Save progress every 10 batches
            if batch_count % 10 == 0:
                save_progress(distances)

            # Rate limiting
            time.sleep(DELAY_BETWEEN)

    pbar.close()

    # ─── Save final results ──────────────────────────────────────────────
    save_progress(distances)

    df["road_distance_km"] = df["Order ID"].astype(str).map(
        lambda oid: distances.get(str(oid))
    )

    success = df["road_distance_km"].notna().sum()
    failed = df["road_distance_km"].isna().sum()

    print(f"\n{'='*50}")
    print(f"RESULTS")
    print(f"{'='*50}")
    print(f"  Successful:    {success:,} ({success/len(df)*100:.1f}%)")
    print(f"  Failed:        {failed:,} ({failed/len(df)*100:.1f}%)")
    if success > 0:
        valid = df["road_distance_km"].dropna()
        print(f"  Avg distance:  {valid.mean():.1f} km")
        print(f"  Max distance:  {valid.max():.1f} km")
        print(f"  Min distance:  {valid.min():.1f} km")
        print(f"  Median:        {valid.median():.1f} km")

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved to: {OUTPUT_FILE}")

    # Clean up progress file
    if failed == 0 and os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
        print("Cleaned up progress file (all orders successful)")
    elif failed > 0:
        print(f"Progress saved — re-run the script to retry {failed} failed orders")

    print("Done!\n")


if __name__ == "__main__":
    main()
