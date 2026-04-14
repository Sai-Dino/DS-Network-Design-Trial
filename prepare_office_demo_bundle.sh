#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_OSRM_SOURCE_DIR="$ROOT_DIR/osrm-data"
if [[ ! -d "$DEFAULT_OSRM_SOURCE_DIR" && -d "$HOME/osrm-data" ]]; then
  DEFAULT_OSRM_SOURCE_DIR="$HOME/osrm-data"
fi
OSRM_SOURCE_DIR="${OSRM_SOURCE_DIR:-$DEFAULT_OSRM_SOURCE_DIR}"
CACHE_SOURCE_DIR="${CACHE_SOURCE_DIR:-$ROOT_DIR/network-optimizer/cache}"
OFFICE_RUNTIME_BUNDLE_DIR="${OFFICE_RUNTIME_BUNDLE_DIR:-$ROOT_DIR/office-runtime-bundle}"
PROFILE_NAME="${OFFICE_RUNTIME_PROFILE:-bangalore-benchmark-103}"
BUNDLE_ROOT="${OFFICE_RUNTIME_BUNDLE_DIR%/}/${PROFILE_NAME}"
MANIFEST_PATH="${MANIFEST_PATH:-$ROOT_DIR/office-demo-manifest.json}"
RUNTIME_MANIFEST_PATH="${RUNTIME_MANIFEST_PATH:-$BUNDLE_ROOT/office-runtime-manifest.json}"
FORCE_REFRESH="${FORCE_REFRESH:-0}"
CREATE_ARCHIVES="${CREATE_ARCHIVES:-0}"
SOURCE_BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
SOURCE_COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"

copy_tree() {
  local src="$1"
  local dst="$2"
  mkdir -p "$dst"
  if [[ "$FORCE_REFRESH" == "1" ]]; then
    rm -rf "$dst"
    mkdir -p "$dst"
  fi
  if cp -cR "$src"/. "$dst"/ 2>/dev/null; then
    return 0
  fi
  if cp -a "$src"/. "$dst"/ 2>/dev/null; then
    return 0
  fi
  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$src"/ "$dst"/
    return 0
  fi
  cp -R "$src"/. "$dst"/
}

echo "Preparing office demo bundle in:"
echo "  $BUNDLE_ROOT"
echo ""

if [[ ! -d "$CACHE_SOURCE_DIR" ]]; then
  echo "ERROR: cache directory missing: $CACHE_SOURCE_DIR"
  exit 1
fi

if [[ ! -d "$OSRM_SOURCE_DIR" ]]; then
  echo "ERROR: OSRM source directory missing: $OSRM_SOURCE_DIR"
  echo "Set OSRM_SOURCE_DIR=/path/to/osrm-data and retry."
  exit 1
fi

if [[ ! -f "$ROOT_DIR/daily_demand_aggregated.csv" ]]; then
  echo "ERROR: daily_demand_aggregated.csv missing from repo root."
  exit 1
fi

if [[ ! -f "$ROOT_DIR/Store details - 103 old stores.csv" ]]; then
  echo "ERROR: required store file missing from repo root."
  exit 1
fi

mkdir -p "$BUNDLE_ROOT/network-optimizer" "$BUNDLE_ROOT/inputs"

echo "Copying OSRM data into runtime bundle..."
copy_tree "$OSRM_SOURCE_DIR" "$BUNDLE_ROOT/osrm-data"

echo "Copying optimizer cache into runtime bundle..."
copy_tree "$CACHE_SOURCE_DIR" "$BUNDLE_ROOT/network-optimizer/cache"

echo "Copying Bangalore 103 inputs into runtime bundle..."
cp "$ROOT_DIR/daily_demand_aggregated.csv" "$BUNDLE_ROOT/inputs/"
cp "$ROOT_DIR/Store details - 103 old stores.csv" "$BUNDLE_ROOT/inputs/"
cp "$ROOT_DIR/Store details - 151 polygons with stores.csv" "$BUNDLE_ROOT/inputs/"
if [[ -f "$ROOT_DIR/benchmark_103_store_metadata.csv" ]]; then
  cp "$ROOT_DIR/benchmark_103_store_metadata.csv" "$BUNDLE_ROOT/inputs/"
elif [[ -f "$ROOT_DIR/benchmark_103_store_sizes.csv" ]]; then
  cp "$ROOT_DIR/benchmark_103_store_sizes.csv" "$BUNDLE_ROOT/inputs/"
elif [[ -f "$ROOT_DIR/analysis/benchmark_103_store_metadata.csv" ]]; then
  cp "$ROOT_DIR/analysis/benchmark_103_store_metadata.csv" "$BUNDLE_ROOT/inputs/"
elif [[ -f "$ROOT_DIR/analysis/benchmark_103_store_sizes.csv" ]]; then
  cp "$ROOT_DIR/analysis/benchmark_103_store_sizes.csv" "$BUNDLE_ROOT/inputs/"
else
  echo "ERROR: benchmark_103 fixed-store metadata file is required for the office runtime bundle."
  echo "       Add benchmark_103_store_metadata.csv (or benchmark_103_store_sizes.csv) at repo root or in analysis/."
  exit 1
fi

if [[ -f "$ROOT_DIR/optimization_results/latest_bangalore_103_decision_packet.json" ]]; then
  mkdir -p "$BUNDLE_ROOT/optimization_results"
  cp "$ROOT_DIR/optimization_results/latest_bangalore_103_decision_packet.json" "$BUNDLE_ROOT/optimization_results/"
fi

if [[ "$CREATE_ARCHIVES" == "1" ]]; then
  echo "Creating optional archives..."
  (cd "$BUNDLE_ROOT" && tar -czf osrm-data.tar.gz osrm-data)
  (cd "$BUNDLE_ROOT" && tar -czf network-optimizer-cache.tar.gz network-optimizer/cache)
fi

python3 - <<'PY' "$ROOT_DIR" "$CACHE_SOURCE_DIR" "$OSRM_SOURCE_DIR" "$MANIFEST_PATH" "$BUNDLE_ROOT" "$RUNTIME_MANIFEST_PATH" "$CREATE_ARCHIVES" "$SOURCE_BRANCH" "$SOURCE_COMMIT"
import json
import os
import hashlib
import sys
from pathlib import Path

root = Path(sys.argv[1])
cache_dir = Path(sys.argv[2])
osrm_dir = Path(sys.argv[3])
manifest_path = Path(sys.argv[4])
bundle_root = Path(sys.argv[5])
runtime_manifest_path = Path(sys.argv[6])
create_archives = sys.argv[7] == '1'
source_branch = sys.argv[8]
source_commit = sys.argv[9]

def summarize_tree(path: Path):
    file_count = 0
    total_bytes = 0
    for dirpath, _, filenames in os.walk(path):
        for name in filenames:
            p = Path(dirpath) / name
            try:
                st = p.stat()
            except FileNotFoundError:
                continue
            file_count += 1
            total_bytes += st.st_size
    return {"path": str(path), "file_count": file_count, "total_bytes": total_bytes}

def rel(path: Path):
    return os.path.relpath(path, root)


optimizer_profile = {
    "fixed_store_mode": "benchmark_103",
    "standard_radius_km": 3.0,
    "super_radius_km": 5.5,
    "business_target_coverage_pct": 99.7,
    "exact_candidate_cap": 3000,
    "exact_graph_max_radius_km": 6.0,
    "fixed_super_min_sqft": 4500,
}
profile_fingerprint = hashlib.sha256(
    json.dumps(optimizer_profile, sort_keys=True, separators=(',', ':')).encode('utf-8')
).hexdigest()[:16]

bundle_manifest = {
    "manifest_version": 2,
    "profile": "bangalore-benchmark-103",
    "profile_fingerprint": profile_fingerprint,
    "bundle_strategy": "git-for-code, runtime-bundle-for-cache-and-osrm",
    "source_branch": source_branch,
    "source_commit": source_commit,
    "bundle_root": rel(bundle_root),
    "optimizer_profile": optimizer_profile,
    "cache": summarize_tree(bundle_root / "network-optimizer" / "cache"),
    "osrm_data": summarize_tree(bundle_root / "osrm-data"),
    "inputs": summarize_tree(bundle_root / "inputs"),
    "decision_packet_present": (bundle_root / "optimization_results" / "latest_bangalore_103_decision_packet.json").exists(),
    "archives": {
        "osrm_data_tar_gz": create_archives and (bundle_root / "osrm-data.tar.gz").exists(),
        "cache_tar_gz": create_archives and (bundle_root / "network-optimizer-cache.tar.gz").exists(),
    },
}
runtime_manifest_path.write_text(json.dumps(bundle_manifest, indent=2))

manifest = {
    "manifest_version": 2,
    "profile": "bangalore-benchmark-103",
    "profile_fingerprint": profile_fingerprint,
    "bundle_strategy": "git-for-code, runtime-bundle-for-cache-and-osrm",
    "source_branch": source_branch,
    "source_commit": source_commit,
    "repo_root": str(root),
    "repo_root_total": summarize_tree(root),
    "repo_runtime": {
        "cache": summarize_tree(cache_dir),
        "osrm_data": summarize_tree(osrm_dir),
    },
    "runtime_bundle_default": rel(bundle_root),
    "runtime_bundle_manifest": rel(runtime_manifest_path),
    "expected_settings": {
        **optimizer_profile,
    },
    "required_files": {
        "office_demo_start": rel(root / "office_demo_start.sh"),
        "office_demo_verify": rel(root / "office_demo_verify.sh"),
        "office_demo_restore": rel(root / "restore_office_demo_runtime.sh"),
        "optimizer_start": rel(root / "network-optimizer" / "start.sh"),
        "osrm_start": rel(root / "network-optimizer" / "start_osrm.sh"),
        "stores_103": rel(root / "Store details - 103 old stores.csv"),
        "stores_151": rel(root / "Store details - 151 polygons with stores.csv"),
        "orders_daily_aggregated": rel(root / "daily_demand_aggregated.csv"),
    },
}
decision_packet_path = root / "optimization_results" / "latest_bangalore_103_decision_packet.json"
if decision_packet_path.exists():
    manifest["optional_files"] = {
        "latest_decision_packet": rel(decision_packet_path),
    }

manifest_path.write_text(json.dumps(manifest, indent=2))
print(f"Wrote manifest to {manifest_path}")
print(f"Wrote runtime manifest to {runtime_manifest_path}")
PY

echo ""
echo "Bundle prep complete."
echo "Next steps:"
echo "  1. Copy $BUNDLE_ROOT to the office machine (same path or any accessible folder)."
echo "  2. On the office machine set:"
echo "       export OFFICE_RUNTIME_BUNDLE_DIR=/path/to/$(basename "$BUNDLE_ROOT")"
echo "  3. Run ./restore_office_demo_runtime.sh"
echo "  4. Run ./office_demo_verify.sh"
echo "  5. Run ./office_demo_start.sh"
