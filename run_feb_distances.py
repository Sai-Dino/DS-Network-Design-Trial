#!/usr/bin/env python3
"""
Flipkart Hyperlocal Distance Calculator
Processes 3.38M February 2026 orders using local OSRM Table API.
Optimized for speed: batching + parallel workers + incremental CSV writes.

Usage:
    python3 run_feb_distances.py

Requirements:
    pip3 install pandas requests tqdm
    OSRM server running on localhost:5000
"""

import csv
import time
import sys
import os
import math
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
from datetime import datetime

# ============ CONFIGURATION ============
INPUT_FILE = "feb_2026_distance_input.csv"
OUTPUT_FILE = "feb_2026_with_road_distances.csv"
OSRM_URL = "http://localhost:5000"
BATCH_SIZE = 100        # destinations per Table API request (max ~100 for stability)
MAX_WORKERS = 12        # parallel threads
REQUEST_TIMEOUT = 30    # seconds per request
# =======================================

def haversine(lat1, lon1, lat2, lon2):
    """Straight-line distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def test_osrm():
    """Verify OSRM server is reachable."""
    try:
        r = requests.get(f"{OSRM_URL}/route/v1/driving/77.5946,12.9716;77.6200,13.0000?overview=false", timeout=10)
        data = r.json()
        if data.get("code") == "Ok":
            dist = data["routes"][0]["distance"] / 1000
            print(f"  OSRM server OK. Test route: {dist:.2f} km")
            return True
        else:
            print(f"  OSRM returned: {data.get('code')} - {data.get('message', '')}")
            return False
    except Exception as e:
        print(f"  Cannot reach OSRM: {e}")
        return False

def batch_table_api(store_lat, store_lon, destinations):
    """
    Call OSRM Table API: one store → many destinations.
    Returns list of (index, distance_km) or (index, None) for failures.
    """
    results = []
    # Build coordinates string: store first, then all destinations
    coords = f"{store_lon},{store_lat}"
    for idx, (olat, olon) in destinations:
        coords += f";{olon},{olat}"

    dest_indices = ";".join(str(i+1) for i in range(len(destinations)))
    url = f"{OSRM_URL}/table/v1/driving/{coords}?sources=0&destinations={dest_indices}&annotations=distance"

    try:
        r = requests.get(url, timeout=REQUEST_TIMEOUT)
        data = r.json()
        if data.get("code") == "Ok":
            distances = data["distances"][0]
            for i, (idx, _) in enumerate(destinations):
                d = distances[i]
                if d is not None and d > 0:
                    results.append((idx, d / 1000))  # meters to km
                else:
                    results.append((idx, None))
        else:
            for idx, _ in destinations:
                results.append((idx, None))
    except Exception:
        for idx, _ in destinations:
            results.append((idx, None))

    return results

def process_store_batches(store_id, store_lat, store_lon, orders, batch_size):
    """
    Process all orders for one store using Table API batching.
    Returns list of (global_index, road_distance_km).
    """
    all_results = []

    # Split orders into batches
    for i in range(0, len(orders), batch_size):
        batch = orders[i:i+batch_size]
        batch_results = batch_table_api(store_lat, store_lon, batch)
        all_results.extend(batch_results)

    return all_results

def main():
    start_time = time.time()

    print("=" * 60)
    print("  Flipkart Hyperlocal Distance Calculator")
    print("  February 2026 - Full Month Processing")
    print("=" * 60)
    print()

    # Check input file
    if not os.path.exists(INPUT_FILE):
        print(f"ERROR: Input file '{INPUT_FILE}' not found!")
        print(f"  Make sure '{INPUT_FILE}' is in the same folder as this script.")
        sys.exit(1)

    # Test OSRM
    print("[1/4] Testing OSRM server...")
    if not test_osrm():
        print("\nERROR: OSRM server not reachable at", OSRM_URL)
        print("Start it with: cd ~/osrm-data && osrm-routed --algorithm mld india-latest.osrm --port 5000")
        sys.exit(1)

    # Load data
    print(f"\n[2/4] Loading {INPUT_FILE}...")
    rows = []
    with open(INPUT_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    total_orders = len(rows)
    print(f"  Loaded {total_orders:,} orders")

    # Group by store
    print("\n[3/4] Grouping orders by store...")
    store_groups = defaultdict(list)
    for i, row in enumerate(rows):
        store_id = row.get('Hub_Code', row.get('store_id', 'unknown'))
        try:
            slat = float(row['Store_Lat'])
            slon = float(row['Store_Lon'])
            olat = float(row['Order_Lat'])
            olon = float(row['Order_Lon'])
            store_groups[(store_id, slat, slon)].append((i, olat, olon))
        except (ValueError, KeyError):
            pass

    num_stores = len(store_groups)
    total_valid = sum(len(v) for v in store_groups.values())
    total_batches = sum(math.ceil(len(v) / BATCH_SIZE) for v in store_groups.values())

    print(f"  {num_stores} stores, {total_valid:,} valid orders")
    print(f"  {total_batches:,} API batches (batch size: {BATCH_SIZE})")
    est_time = total_batches / MAX_WORKERS * 0.08  # ~80ms per batch including overhead
    print(f"  Estimated time: {est_time:.0f}-{est_time*2:.0f} seconds")

    # Process with parallel workers
    print(f"\n[4/4] Calculating distances ({MAX_WORKERS} workers)...")

    # Prepare result array
    distances = [None] * total_orders
    completed = 0
    failed = 0

    # Build all batch tasks
    tasks = []
    for (store_id, slat, slon), order_list in store_groups.items():
        # Split into batches
        for i in range(0, len(order_list), BATCH_SIZE):
            batch = [(idx, (olat, olon)) for idx, olat, olon in order_list[i:i+BATCH_SIZE]]
            tasks.append((store_id, slat, slon, batch))

    processed_batches = 0
    last_print_time = time.time()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for store_id, slat, slon, batch in tasks:
            future = executor.submit(batch_table_api, slat, slon, batch)
            futures[future] = (store_id, len(batch))

        for future in as_completed(futures):
            store_id, batch_len = futures[future]
            try:
                results = future.result()
                for idx, dist in results:
                    distances[idx] = dist
                    if dist is not None:
                        completed += 1
                    else:
                        failed += 1
            except Exception as e:
                failed += batch_len

            processed_batches += 1

            # Print progress every 2 seconds
            now = time.time()
            if now - last_print_time >= 2:
                pct = (completed + failed) / total_valid * 100
                elapsed = now - start_time
                rate = (completed + failed) / elapsed if elapsed > 0 else 0
                eta = (total_valid - completed - failed) / rate if rate > 0 else 0
                print(f"  Progress: {completed + failed:,}/{total_valid:,} ({pct:.1f}%) | "
                      f"OK: {completed:,} | Failed: {failed:,} | "
                      f"Rate: {rate:,.0f}/sec | ETA: {eta:.0f}s")
                last_print_time = now

    elapsed = time.time() - start_time

    print(f"\n  Done! {completed:,} distances calculated, {failed:,} failed")
    print(f"  Time: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
    print(f"  Rate: {completed/elapsed:,.0f} orders/second")

    # Write output
    print(f"\n  Writing {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Order_ID', 'Hub_Code', 'Store_Lat', 'Store_Lon',
                         'Order_Lat', 'Order_Lon', 'Road_Distance_km',
                         'Straight_Distance_km', 'Detour_Ratio'])

        for i, row in enumerate(rows):
            road_dist = distances[i]
            try:
                slat = float(row['Store_Lat'])
                slon = float(row['Store_Lon'])
                olat = float(row['Order_Lat'])
                olon = float(row['Order_Lon'])
                straight_dist = haversine(slat, slon, olat, olon)
            except:
                straight_dist = 0

            detour = round(road_dist / straight_dist, 2) if road_dist and straight_dist > 0 else ''

            writer.writerow([
                row.get('Date', ''),
                row.get('Order_ID', ''),
                row.get('Hub_Code', ''),
                row.get('Store_Lat', ''),
                row.get('Store_Lon', ''),
                row.get('Order_Lat', ''),
                row.get('Order_Lon', ''),
                round(road_dist, 3) if road_dist else '',
                round(straight_dist, 3) if straight_dist else '',
                detour
            ])

    output_size = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"  Output: {OUTPUT_FILE} ({output_size:.1f} MB)")

    # Summary
    valid_distances = [d for d in distances if d is not None]
    if valid_distances:
        avg_dist = sum(valid_distances) / len(valid_distances)
        max_dist = max(valid_distances)
        min_dist = min(valid_distances)
        valid_distances.sort()
        median_dist = valid_distances[len(valid_distances) // 2]

        print(f"\n{'=' * 60}")
        print(f"  SUMMARY")
        print(f"{'=' * 60}")
        print(f"  Total Orders:    {total_orders:,}")
        print(f"  Successful:      {completed:,} ({completed/total_orders*100:.1f}%)")
        print(f"  Failed:          {failed:,}")
        print(f"  Avg Distance:    {avg_dist:.2f} km")
        print(f"  Median Distance: {median_dist:.2f} km")
        print(f"  Min Distance:    {min_dist:.2f} km")
        print(f"  Max Distance:    {max_dist:.2f} km")
        print(f"  Total Time:      {elapsed:.1f}s ({elapsed/60:.1f} min)")
        print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
