#!/usr/bin/env python3
"""
Generate a standalone HTML dashboard from OSRM distance results.
Reads the output CSV and creates an interactive dashboard with Chart.js.
No browser memory issues - all stats are pre-computed by Python.

Usage:
    python3 generate_dashboard.py

Input:  feb_2026_with_road_distances.csv (in same folder)
Output: feb_2026_dashboard.html (open in Chrome)
"""

import csv
import json
import os
import sys
from collections import defaultdict
from datetime import datetime
import math

INPUT_FILE = "feb_2026_with_road_distances.csv"
OUTPUT_FILE = "feb_2026_dashboard.html"

def main():
    print("=" * 60)
    print("  Dashboard Generator - February 2026 Orders")
    print("=" * 60)

    if not os.path.exists(INPUT_FILE):
        print(f"ERROR: {INPUT_FILE} not found!")
        sys.exit(1)

    print(f"\n[1/3] Reading {INPUT_FILE}...")

    # Collect stats
    total = 0
    successful = 0
    failed = 0
    distances = []
    store_distances = defaultdict(list)
    store_orders = defaultdict(int)
    store_coords = {}
    date_orders = defaultdict(int)
    date_distances = defaultdict(list)

    # Distance bins
    bins = {'0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0, '10+': 0}
    range_bins = {'0-3 km': 0, '3-5 km': 0, '5-8 km': 0, '8-10 km': 0, '10+ km': 0}

    # Sample data for map (every Nth row)
    map_samples = []
    SAMPLE_RATE = 500  # 1 in 500 = ~6700 points

    with open(INPUT_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            if total % 500000 == 0:
                print(f"  ...{total:,} rows processed")

            dist_str = row.get('Road_Distance_km', '')
            store_id = row.get('Hub_Code', row.get('Store_ID', 'Unknown'))
            date = row.get('Date', '')

            date_orders[date] += 1
            store_orders[store_id] += 1

            # Store coordinates
            if store_id not in store_coords:
                try:
                    store_coords[store_id] = {
                        'lat': float(row.get('Store_Lat', 0)),
                        'lon': float(row.get('Store_Lon', 0))
                    }
                except:
                    pass

            if dist_str and dist_str.strip():
                try:
                    dist = float(dist_str)
                    if dist > 0:
                        successful += 1
                        distances.append(dist)
                        store_distances[store_id].append(dist)
                        date_distances[date].append(dist)

                        # Bins
                        if dist < 2: bins['0-2'] += 1
                        elif dist < 4: bins['2-4'] += 1
                        elif dist < 6: bins['4-6'] += 1
                        elif dist < 8: bins['6-8'] += 1
                        elif dist < 10: bins['8-10'] += 1
                        else: bins['10+'] += 1

                        if dist < 3: range_bins['0-3 km'] += 1
                        elif dist < 5: range_bins['3-5 km'] += 1
                        elif dist < 8: range_bins['5-8 km'] += 1
                        elif dist < 10: range_bins['8-10 km'] += 1
                        else: range_bins['10+ km'] += 1

                        # Sample for map
                        if total % SAMPLE_RATE == 0:
                            try:
                                map_samples.append({
                                    's': store_id,
                                    'slat': float(row.get('Store_Lat', 0)),
                                    'slon': float(row.get('Store_Lon', 0)),
                                    'olat': float(row.get('Order_Lat', 0)),
                                    'olon': float(row.get('Order_Lon', 0)),
                                    'd': round(dist, 2)
                                })
                            except:
                                pass
                    else:
                        failed += 1
                except:
                    failed += 1
            else:
                failed += 1

    print(f"  Total: {total:,} | OK: {successful:,} | Failed: {failed:,}")

    # Compute statistics
    print("\n[2/3] Computing statistics...")
    distances.sort()
    avg_dist = sum(distances) / len(distances) if distances else 0
    median_dist = distances[len(distances) // 2] if distances else 0
    min_dist = distances[0] if distances else 0
    max_dist = distances[-1] if distances else 0

    # Percentiles
    p25 = distances[int(len(distances) * 0.25)] if distances else 0
    p75 = distances[int(len(distances) * 0.75)] if distances else 0
    p90 = distances[int(len(distances) * 0.90)] if distances else 0
    p95 = distances[int(len(distances) * 0.95)] if distances else 0

    # Store-level stats
    store_stats = []
    for store_id in sorted(store_distances.keys()):
        dists = store_distances[store_id]
        dists.sort()
        store_stats.append({
            'id': store_id,
            'orders': len(dists),
            'avg': round(sum(dists) / len(dists), 2),
            'median': round(dists[len(dists) // 2], 2),
            'min': round(dists[0], 2),
            'max': round(dists[-1], 2),
            'p90': round(dists[int(len(dists) * 0.9)], 2),
            'lat': store_coords.get(store_id, {}).get('lat', 0),
            'lon': store_coords.get(store_id, {}).get('lon', 0)
        })

    # Sort by avg distance for chart
    store_stats_sorted = sorted(store_stats, key=lambda x: x['avg'], reverse=True)

    # Daily stats
    daily_stats = []
    for date in sorted(date_orders.keys()):
        if date and date_distances.get(date):
            dists = date_distances[date]
            daily_stats.append({
                'date': date,
                'orders': date_orders[date],
                'avg_dist': round(sum(dists) / len(dists), 2),
                'success': len(dists)
            })

    # Build chart data
    histogram_labels = json.dumps(list(bins.keys()))
    histogram_values = json.dumps(list(bins.values()))
    range_labels = json.dumps(list(range_bins.keys()))
    range_values = json.dumps(list(range_bins.values()))

    # Top 30 stores by avg distance for chart
    top_stores_labels = json.dumps([s['id'][-15:] for s in store_stats_sorted[:30]])
    top_stores_avg = json.dumps([s['avg'] for s in store_stats_sorted[:30]])
    top_stores_orders_labels = json.dumps([s['id'][-15:] for s in sorted(store_stats, key=lambda x: x['orders'], reverse=True)[:30]])
    top_stores_orders_values = json.dumps([s['orders'] for s in sorted(store_stats, key=lambda x: x['orders'], reverse=True)[:30]])

    daily_labels = json.dumps([d['date'] for d in daily_stats])
    daily_orders = json.dumps([d['orders'] for d in daily_stats])
    daily_avg_dist = json.dumps([d['avg_dist'] for d in daily_stats])

    store_table_json = json.dumps(store_stats_sorted)
    map_data_json = json.dumps(map_samples)
    store_coords_json = json.dumps([{'id': s['id'], 'lat': s['lat'], 'lon': s['lon'], 'orders': s['orders'], 'avg': s['avg']} for s in store_stats])

    # Generate HTML
    print("\n[3/3] Generating dashboard...")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flipkart Hyperlocal - February 2026 Distance Dashboard</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; }}
        .header {{ background: linear-gradient(135deg, #2874f0 0%, #1d4ed8 100%); color: white; padding: 20px 24px; }}
        .header h1 {{ font-size: 24px; font-weight: 600; }}
        .header p {{ font-size: 13px; opacity: 0.9; margin-top: 4px; }}
        .container {{ max-width: 1400px; margin: 0 auto; padding: 20px; }}
        .tabs {{ display: flex; background: white; border-bottom: 2px solid #e8eaed; margin-bottom: 20px; border-radius: 8px 8px 0 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .tab-btn {{ padding: 14px 20px; background: none; border: none; color: #666; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }}
        .tab-btn.active {{ color: #2874f0; border-bottom-color: #2874f0; }}
        .tab-btn:hover {{ color: #2874f0; background: #f5f7fa; }}
        .tab-content {{ display: none; }}
        .tab-content.active {{ display: block; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }}
        .stat-card {{ background: white; border-radius: 8px; padding: 16px; border: 1px solid #e8eaed; }}
        .stat-card .label {{ font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }}
        .stat-card .value {{ font-size: 28px; font-weight: 700; color: #2874f0; margin-top: 4px; }}
        .stat-card .value.red {{ color: #ef4444; }}
        .stat-card .value.green {{ color: #22c55e; }}
        .stat-card .sub {{ font-size: 12px; color: #999; }}
        .charts-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }}
        .chart-box {{ background: white; border-radius: 8px; padding: 20px; border: 1px solid #e8eaed; }}
        .chart-box h3 {{ font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #333; }}
        .chart-box canvas {{ max-height: 300px; }}
        .full-width {{ grid-column: 1 / -1; }}
        #map {{ height: 500px; border-radius: 8px; border: 1px solid #e8eaed; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
        th {{ background: #f8fafc; padding: 10px 12px; text-align: left; font-weight: 600; color: #555; border-bottom: 2px solid #e8eaed; cursor: pointer; }}
        th:hover {{ background: #eef2f7; }}
        td {{ padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }}
        tr:hover {{ background: #f8fafc; }}
        .table-wrapper {{ background: white; border-radius: 8px; padding: 20px; border: 1px solid #e8eaed; overflow-x: auto; }}
        .search-box {{ padding: 8px 12px; border: 1px solid #d0d7de; border-radius: 4px; font-size: 13px; width: 300px; margin-bottom: 16px; }}
        .percentile-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }}
        .pct-card {{ background: white; border-radius: 8px; padding: 12px 16px; border: 1px solid #e8eaed; text-align: center; }}
        .pct-card .pct-label {{ font-size: 11px; color: #888; font-weight: 600; }}
        .pct-card .pct-value {{ font-size: 20px; font-weight: 700; color: #1d4ed8; }}
        .legend {{ display: flex; gap: 16px; margin: 12px 0; font-size: 12px; }}
        .legend span {{ display: flex; align-items: center; gap: 4px; }}
        .legend .dot {{ width: 10px; height: 10px; border-radius: 50%; display: inline-block; }}
        @media (max-width: 768px) {{ .charts-grid {{ grid-template-columns: 1fr; }} .stats-grid {{ grid-template-columns: repeat(2, 1fr); }} }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Flipkart Hyperlocal Distance Dashboard</h1>
        <p>February 2026 | {total:,} orders across {len(store_stats)} stores | Generated {datetime.now().strftime('%d %b %Y %H:%M')}</p>
    </div>

    <div class="container">
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('overview')">Overview</button>
            <button class="tab-btn" onclick="switchTab('stores')">Store Analysis</button>
            <button class="tab-btn" onclick="switchTab('daily')">Daily Trends</button>
            <button class="tab-btn" onclick="switchTab('mapview')">Map View</button>
            <button class="tab-btn" onclick="switchTab('table')">Store Table</button>
        </div>

        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card"><div class="label">Total Orders</div><div class="value">{total:,}</div></div>
                <div class="stat-card"><div class="label">Successful</div><div class="value green">{successful:,}</div><div class="sub">{successful/total*100:.1f}%</div></div>
                <div class="stat-card"><div class="label">Failed</div><div class="value red">{failed:,}</div><div class="sub">{failed/total*100:.2f}%</div></div>
                <div class="stat-card"><div class="label">Avg Distance</div><div class="value">{avg_dist:.2f}</div><div class="sub">km</div></div>
                <div class="stat-card"><div class="label">Median Distance</div><div class="value">{median_dist:.2f}</div><div class="sub">km</div></div>
                <div class="stat-card"><div class="label">Max Distance</div><div class="value">{max_dist:.2f}</div><div class="sub">km</div></div>
                <div class="stat-card"><div class="label">Total Stores</div><div class="value">{len(store_stats)}</div></div>
            </div>

            <div class="percentile-grid">
                <div class="pct-card"><div class="pct-label">MIN</div><div class="pct-value">{min_dist:.2f} km</div></div>
                <div class="pct-card"><div class="pct-label">25th %ile</div><div class="pct-value">{p25:.2f} km</div></div>
                <div class="pct-card"><div class="pct-label">MEDIAN</div><div class="pct-value">{median_dist:.2f} km</div></div>
                <div class="pct-card"><div class="pct-label">75th %ile</div><div class="pct-value">{p75:.2f} km</div></div>
                <div class="pct-card"><div class="pct-label">90th %ile</div><div class="pct-value">{p90:.2f} km</div></div>
                <div class="pct-card"><div class="pct-label">95th %ile</div><div class="pct-value">{p95:.2f} km</div></div>
                <div class="pct-card"><div class="pct-label">MAX</div><div class="pct-value">{max_dist:.2f} km</div></div>
            </div>

            <div class="charts-grid">
                <div class="chart-box">
                    <h3>Distance Distribution</h3>
                    <canvas id="histogramChart"></canvas>
                </div>
                <div class="chart-box">
                    <h3>Distance Ranges</h3>
                    <canvas id="donutChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Store Analysis Tab -->
        <div id="stores" class="tab-content">
            <div class="charts-grid">
                <div class="chart-box">
                    <h3>Average Distance by Store (Top 30)</h3>
                    <canvas id="storeAvgChart"></canvas>
                </div>
                <div class="chart-box">
                    <h3>Orders per Store (Top 30)</h3>
                    <canvas id="storeOrdersChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Daily Trends Tab -->
        <div id="daily" class="tab-content">
            <div class="charts-grid">
                <div class="chart-box full-width">
                    <h3>Daily Order Volume</h3>
                    <canvas id="dailyOrdersChart"></canvas>
                </div>
                <div class="chart-box full-width">
                    <h3>Daily Average Distance</h3>
                    <canvas id="dailyDistChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Map Tab -->
        <div id="mapview" class="tab-content">
            <div class="legend">
                <span><span class="dot" style="background:#2874f0"></span> Store</span>
                <span><span class="dot" style="background:#22c55e"></span> &lt;3 km</span>
                <span><span class="dot" style="background:#f59e0b"></span> 3-7 km</span>
                <span><span class="dot" style="background:#ef4444"></span> &gt;7 km</span>
                <span style="color:#888;">(Showing ~{len(map_samples):,} sampled points)</span>
            </div>
            <div id="map"></div>
        </div>

        <!-- Store Table Tab -->
        <div id="table" class="tab-content">
            <div class="table-wrapper">
                <input type="text" class="search-box" id="searchBox" placeholder="Search store..." oninput="filterTable()">
                <table id="storeTable">
                    <thead>
                        <tr>
                            <th onclick="sortBy('id')">Store ID</th>
                            <th onclick="sortBy('orders')">Orders</th>
                            <th onclick="sortBy('avg')">Avg Dist (km)</th>
                            <th onclick="sortBy('median')">Median (km)</th>
                            <th onclick="sortBy('min')">Min (km)</th>
                            <th onclick="sortBy('max')">Max (km)</th>
                            <th onclick="sortBy('p90')">P90 (km)</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Tab switching
        function switchTab(name) {{
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(name).classList.add('active');
            event.target.classList.add('active');
            if (name === 'mapview' && !window.mapInitialized) initMap();
        }}

        // Charts
        const chartColors = ['#2874f0', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

        new Chart(document.getElementById('histogramChart'), {{
            type: 'bar',
            data: {{
                labels: {histogram_labels},
                datasets: [{{ label: 'Orders', data: {histogram_values}, backgroundColor: '#2874f0', borderRadius: 4 }}]
            }},
            options: {{ responsive: true, plugins: {{ legend: {{ display: false }} }}, scales: {{ y: {{ beginAtZero: true, ticks: {{ callback: v => v >= 1000 ? (v/1000)+'K' : v }} }} }} }}
        }});

        new Chart(document.getElementById('donutChart'), {{
            type: 'doughnut',
            data: {{
                labels: {range_labels},
                datasets: [{{ data: {range_values}, backgroundColor: ['#22c55e', '#2874f0', '#f59e0b', '#ef4444', '#8b5cf6'] }}]
            }},
            options: {{ responsive: true, plugins: {{ legend: {{ position: 'right' }} }} }}
        }});

        new Chart(document.getElementById('storeAvgChart'), {{
            type: 'bar',
            data: {{
                labels: {top_stores_labels},
                datasets: [{{ label: 'Avg Distance (km)', data: {top_stores_avg}, backgroundColor: '#2874f0', borderRadius: 4 }}]
            }},
            options: {{ indexAxis: 'y', responsive: true, plugins: {{ legend: {{ display: false }} }}, scales: {{ x: {{ beginAtZero: true }} }} }}
        }});

        new Chart(document.getElementById('storeOrdersChart'), {{
            type: 'bar',
            data: {{
                labels: {top_stores_orders_labels},
                datasets: [{{ label: 'Orders', data: {top_stores_orders_values}, backgroundColor: '#22c55e', borderRadius: 4 }}]
            }},
            options: {{ indexAxis: 'y', responsive: true, plugins: {{ legend: {{ display: false }} }}, scales: {{ x: {{ beginAtZero: true, ticks: {{ callback: v => v >= 1000 ? (v/1000)+'K' : v }} }} }} }}
        }});

        new Chart(document.getElementById('dailyOrdersChart'), {{
            type: 'line',
            data: {{
                labels: {daily_labels},
                datasets: [{{ label: 'Orders', data: {daily_orders}, borderColor: '#2874f0', backgroundColor: 'rgba(40,116,240,0.1)', fill: true, tension: 0.3 }}]
            }},
            options: {{ responsive: true, scales: {{ y: {{ beginAtZero: true, ticks: {{ callback: v => v >= 1000 ? (v/1000)+'K' : v }} }} }} }}
        }});

        new Chart(document.getElementById('dailyDistChart'), {{
            type: 'line',
            data: {{
                labels: {daily_labels},
                datasets: [{{ label: 'Avg Distance (km)', data: {daily_avg_dist}, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3 }}]
            }},
            options: {{ responsive: true, scales: {{ y: {{ beginAtZero: false }} }} }}
        }});

        // Map
        window.mapInitialized = false;
        function initMap() {{
            const map = L.map('map').setView([12.9716, 77.5946], 11);
            L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
                attribution: '&copy; OpenStreetMap'
            }}).addTo(map);

            const stores = {store_coords_json};
            stores.forEach(s => {{
                if (s.lat && s.lon) {{
                    L.circleMarker([s.lat, s.lon], {{
                        radius: 7, fillColor: '#2874f0', color: '#fff', weight: 2, fillOpacity: 0.9
                    }}).bindPopup('<b>' + s.id + '</b><br>Orders: ' + s.orders.toLocaleString() + '<br>Avg: ' + s.avg + ' km').addTo(map);
                }}
            }});

            const samples = {map_data_json};
            samples.forEach(d => {{
                const color = d.d < 3 ? '#22c55e' : d.d < 7 ? '#f59e0b' : '#ef4444';
                L.circleMarker([d.olat, d.olon], {{
                    radius: 3, fillColor: color, color: color, weight: 0.5, fillOpacity: 0.6
                }}).addTo(map);
            }});

            window.mapInitialized = true;
        }}

        // Store Table
        let storeData = {store_table_json};
        let sortField = 'avg';
        let sortAsc = false;

        function renderTable(data) {{
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = data.map(s =>
                '<tr><td>' + s.id + '</td><td>' + s.orders.toLocaleString() + '</td><td>' + s.avg + '</td><td>' + s.median + '</td><td>' + s.min + '</td><td>' + s.max + '</td><td>' + s.p90 + '</td></tr>'
            ).join('');
        }}

        function sortBy(field) {{
            if (sortField === field) sortAsc = !sortAsc;
            else {{ sortField = field; sortAsc = field === 'id'; }}
            storeData.sort((a, b) => {{
                const va = a[field], vb = b[field];
                if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
                return sortAsc ? va - vb : vb - va;
            }});
            renderTable(storeData);
        }}

        function filterTable() {{
            const q = document.getElementById('searchBox').value.toLowerCase();
            const filtered = storeData.filter(s => s.id.toLowerCase().includes(q));
            renderTable(filtered);
        }}

        renderTable(storeData);
    </script>
</body>
</html>"""

    with open(OUTPUT_FILE, 'w') as f:
        f.write(html)

    size = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"\n  Dashboard saved: {OUTPUT_FILE} ({size:.0f} KB)")
    print(f"  Open it in Chrome to view!")
    print("=" * 60)

if __name__ == "__main__":
    main()
