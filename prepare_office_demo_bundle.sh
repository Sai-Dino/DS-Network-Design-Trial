#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OSRM_SOURCE_DIR="${OSRM_SOURCE_DIR:-$HOME/osrm-data}"
OSRM_DEST_DIR="${OSRM_DEST_DIR:-$ROOT_DIR/osrm-data}"
CACHE_DIR="${CACHE_DIR:-$ROOT_DIR/network-optimizer/cache}"
MANIFEST_PATH="${MANIFEST_PATH:-$ROOT_DIR/office-demo-manifest.json}"
FORCE_REFRESH="${FORCE_REFRESH:-0}"
ORDERS_CSV_SOURCE="${ORDERS_CSV_SOURCE:-$HOME/Downloads/feb_2026_distance_input.csv}"
ORDERS_ZIP_SOURCE="${ORDERS_ZIP_SOURCE:-$HOME/Downloads/feb_2026_distance_input.csv.zip}"
ORDERS_CSV_DEST="${ORDERS_CSV_DEST:-$ROOT_DIR/feb_2026_distance_input.csv}"
ORDERS_ZIP_DEST="${ORDERS_ZIP_DEST:-$ROOT_DIR/feb_2026_distance_input.csv.zip}"

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
echo "  $ROOT_DIR"
echo ""

if [[ ! -d "$CACHE_DIR" ]]; then
  echo "ERROR: cache directory missing: $CACHE_DIR"
  exit 1
fi

if [[ ! -d "$OSRM_SOURCE_DIR" ]]; then
  echo "ERROR: OSRM source directory missing: $OSRM_SOURCE_DIR"
  echo "Set OSRM_SOURCE_DIR=/path/to/osrm-data and retry."
  exit 1
fi

if [[ ! -f "$ROOT_DIR/Store details - 103 old stores.csv" ]]; then
  echo "ERROR: required store file missing from repo root."
  exit 1
fi

if [[ -f "$ORDERS_CSV_SOURCE" && ! -f "$ORDERS_CSV_DEST" ]]; then
  echo "Copying demo orders CSV into repo bundle..."
  cp "$ORDERS_CSV_SOURCE" "$ORDERS_CSV_DEST"
fi

if [[ -f "$ORDERS_ZIP_SOURCE" && ! -f "$ORDERS_ZIP_DEST" ]]; then
  echo "Copying demo orders ZIP into repo bundle..."
  cp "$ORDERS_ZIP_SOURCE" "$ORDERS_ZIP_DEST"
fi

if [[ ! -d "$OSRM_DEST_DIR" || "$FORCE_REFRESH" == "1" ]]; then
  echo "Copying OSRM data into repo bundle..."
  copy_tree "$OSRM_SOURCE_DIR" "$OSRM_DEST_DIR"
else
  echo "Repo-local osrm-data already exists, leaving it in place."
fi

python3 - <<'PY' "$ROOT_DIR" "$CACHE_DIR" "$OSRM_DEST_DIR" "$MANIFEST_PATH"
import json
import os
import sys
from pathlib import Path

root = Path(sys.argv[1])
cache_dir = Path(sys.argv[2])
osrm_dir = Path(sys.argv[3])
manifest_path = Path(sys.argv[4])

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

manifest = {
    "bundle_root": str(root),
    "bundle_root_total": summarize_tree(root),
    "cache": summarize_tree(cache_dir),
    "osrm_data": summarize_tree(osrm_dir),
    "required_files": {
        "office_demo_start": str(root / "office_demo_start.sh"),
        "office_demo_verify": str(root / "office_demo_verify.sh"),
        "optimizer_start": str(root / "network-optimizer" / "start.sh"),
        "osrm_start": str(root / "network-optimizer" / "start_osrm.sh"),
        "stores_103": str(root / "Store details - 103 old stores.csv"),
        "stores_151": str(root / "Store details - 151 polygons with stores.csv"),
        "orders_csv": str(root / "feb_2026_distance_input.csv"),
        "orders_zip": str(root / "feb_2026_distance_input.csv.zip"),
    },
}

manifest_path.write_text(json.dumps(manifest, indent=2))
print(f"Wrote manifest to {manifest_path}")
PY

echo ""
echo "Bundle prep complete."
echo "Next steps:"
echo "  1. Commit this repo state (preferably with Git LFS for osrm-data and cache)."
echo "  2. Clone on the office machine."
echo "  3. Run ./office_demo_verify.sh"
echo "  4. Run ./office_demo_start.sh"
