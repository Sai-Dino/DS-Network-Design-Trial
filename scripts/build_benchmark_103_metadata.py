#!/usr/bin/env python3
"""
Build benchmark_103_store_metadata.csv from real store-size data.

Sources:
    bangalore_store_sizes.csv              — authoritative store sizes (sq ft)
    Store details - 103 old stores.csv     — the 103 fixed stores
    analysis/old_103_to_151_site_crosswalk.csv  — old→new site ID mapping

Output:
    benchmark_103_store_metadata.csv  (repo root)

Super-eligibility rule:
    super_eligible_fixed = 1 when store_sqft > threshold, else 0

Threshold resolution (highest precedence first):
    1. --threshold CLI arg
    2. BENCHMARK_103_SUPER_MIN_SQFT env var
    3. DEFAULT_FIXED_SUPER_MIN_SQFT parsed from network-optimizer/server.py
    4. Hardcoded fallback: 4500
"""

import argparse
import csv
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)


def _server_default_threshold():
    """Read DEFAULT_FIXED_SUPER_MIN_SQFT from server.py without importing it."""
    server_path = os.path.join(REPO_ROOT, 'network-optimizer', 'server.py')
    if not os.path.isfile(server_path):
        return 4500.0
    with open(server_path, 'r', encoding='utf-8') as f:
        for line in f:
            stripped = line.strip()
            if stripped.startswith('DEFAULT_FIXED_SUPER_MIN_SQFT'):
                try:
                    return float(stripped.split('=')[1].strip().rstrip(','))
                except (IndexError, ValueError):
                    pass
    return 4500.0


def resolve_threshold(cli_value=None):
    if cli_value is not None:
        return float(cli_value)
    env_val = os.environ.get('BENCHMARK_103_SUPER_MIN_SQFT')
    if env_val is not None:
        return float(env_val)
    return _server_default_threshold()


def parse_sqft(raw):
    cleaned = str(raw).strip().replace(',', '').replace('"', '')
    try:
        return int(float(cleaned))
    except (ValueError, TypeError):
        return None


def load_store_sizes(path):
    """Returns (by_site_id_lower, by_store_code_prefix_lower)."""
    by_id = {}
    by_code = {}
    with open(path, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            site_id = row['SiteID'].strip()
            store_code = row['Store code'].strip()
            sqft = parse_sqft(row['Store size (in Sq.ft)'])
            entry = {'site_id': site_id, 'store_code': store_code, 'sqft': sqft}
            by_id[site_id.lower()] = entry
            code_prefix = store_code.split('_wh_')[0].lower()
            by_code[code_prefix] = entry
    return by_id, by_code


def load_fixed_103(path):
    ids = set()
    with open(path, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            sid = row.get('site_ID', '').strip()
            if sid:
                ids.add(sid.lower())
    return sorted(ids)


def load_crosswalk(path):
    mapping = {}
    if not os.path.isfile(path):
        return mapping
    with open(path, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            mapping[row['old_site_id'].strip().lower()] = row['new_site_id'].strip().lower()
    return mapping


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--threshold', type=float, default=None,
                        help='Super-eligibility sqft threshold (default: from server.py)')
    parser.add_argument('--output', default=os.path.join(REPO_ROOT, 'benchmark_103_store_metadata.csv'))
    parser.add_argument('--store-sizes', default=os.path.join(REPO_ROOT, 'bangalore_store_sizes.csv'))
    parser.add_argument('--stores-103', default=os.path.join(REPO_ROOT, 'Store details - 103 old stores.csv'))
    parser.add_argument('--crosswalk', default=os.path.join(REPO_ROOT, 'analysis', 'old_103_to_151_site_crosswalk.csv'))
    args = parser.parse_args()

    threshold = resolve_threshold(args.threshold)
    print(f"Super-eligibility threshold: {threshold} sq ft")

    by_id, by_code = load_store_sizes(args.store_sizes)
    fixed_ids = load_fixed_103(args.stores_103)
    crosswalk = load_crosswalk(args.crosswalk)
    print(f"Store sizes: {len(by_id)} entries | Fixed 103: {len(fixed_ids)} | Crosswalk: {len(crosswalk)}")

    rows = []
    stats = {'direct': 0, 'crosswalk': 0, 'code_prefix': 0, 'unmatched': 0}

    for sid in fixed_ids:
        entry = None
        if sid in by_id:
            entry = by_id[sid]; stats['direct'] += 1
        elif sid in crosswalk and crosswalk[sid] in by_id:
            entry = by_id[crosswalk[sid]]; stats['crosswalk'] += 1
        elif sid in by_code:
            entry = by_code[sid]; stats['code_prefix'] += 1
        else:
            stats['unmatched'] += 1

        sqft = entry['sqft'] if entry else None
        eligible = 1 if (sqft is not None and sqft > threshold) else 0
        rows.append({'site_id': sid, 'store_sqft': sqft if sqft is not None else '', 'super_eligible_fixed': eligible})

    with open(args.output, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['site_id', 'store_sqft', 'super_eligible_fixed'])
        w.writeheader()
        w.writerows(rows)

    super_count = sum(1 for r in rows if r['super_eligible_fixed'] == 1)
    unmatched_ids = [r['site_id'] for r in rows if r['store_sqft'] == '']

    print(f"Match: direct={stats['direct']} crosswalk={stats['crosswalk']} code_prefix={stats['code_prefix']} unmatched={stats['unmatched']}")
    print(f"Super-eligible: {super_count}/{len(rows)} (threshold > {threshold})")
    print(f"Wrote: {args.output} ({len(rows)} rows)")
    if unmatched_ids:
        print(f"WARNING: {len(unmatched_ids)} stores without size data (default to not eligible): {unmatched_ids}")


if __name__ == '__main__':
    main()
