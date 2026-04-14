#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_DIR="${OFFICE_RUNTIME_BUNDLE_DIR:-$ROOT_DIR/office-runtime-bundle/bangalore-benchmark-103}"
OSRM_DEST_DIR="${OSRM_DATA_DIR:-$ROOT_DIR/osrm-data}"
CACHE_DEST_DIR="${CACHE_DIR:-$ROOT_DIR/network-optimizer/cache}"
FORCE_REFRESH="${FORCE_REFRESH:-0}"
ACTIVE_MANIFEST_PATH="${ACTIVE_RUNTIME_MANIFEST_PATH:-$ROOT_DIR/.office-runtime-active-manifest.json}"

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

extract_archive() {
  local archive_path="$1"
  local dst_root="$2"
  mkdir -p "$dst_root"
  tar -xzf "$archive_path" -C "$dst_root"
}

echo "Restoring office runtime assets into:"
echo "  $ROOT_DIR"
echo "From bundle:"
echo "  $BUNDLE_DIR"
echo ""

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "ERROR: runtime bundle directory not found: $BUNDLE_DIR"
  exit 1
fi

if [[ -d "$BUNDLE_DIR/osrm-data" ]]; then
  echo "Restoring OSRM data..."
  copy_tree "$BUNDLE_DIR/osrm-data" "$OSRM_DEST_DIR"
elif [[ -f "$BUNDLE_DIR/osrm-data.tar.gz" ]]; then
  echo "Extracting OSRM data archive..."
  extract_archive "$BUNDLE_DIR/osrm-data.tar.gz" "$ROOT_DIR"
else
  echo "ERROR: no OSRM data found in bundle."
  exit 1
fi

if [[ -d "$BUNDLE_DIR/network-optimizer/cache" ]]; then
  echo "Restoring optimizer cache..."
  copy_tree "$BUNDLE_DIR/network-optimizer/cache" "$CACHE_DEST_DIR"
elif [[ -f "$BUNDLE_DIR/network-optimizer-cache.tar.gz" ]]; then
  echo "Extracting optimizer cache archive..."
  mkdir -p "$ROOT_DIR/network-optimizer"
  extract_archive "$BUNDLE_DIR/network-optimizer-cache.tar.gz" "$ROOT_DIR"
else
  echo "ERROR: no optimizer cache found in bundle."
  exit 1
fi

if [[ -d "$BUNDLE_DIR/inputs" ]]; then
  echo "Restoring bundled inputs..."
  copy_tree "$BUNDLE_DIR/inputs" "$ROOT_DIR"
fi

if [[ -d "$BUNDLE_DIR/optimization_results" ]]; then
  echo "Restoring bundled optimization results..."
  copy_tree "$BUNDLE_DIR/optimization_results" "$ROOT_DIR/optimization_results"
fi

if [[ -f "$BUNDLE_DIR/office-runtime-manifest.json" ]]; then
  cp "$BUNDLE_DIR/office-runtime-manifest.json" "$ACTIVE_MANIFEST_PATH"
fi

echo ""
echo "Runtime restore complete."
echo "Next:"
echo "  ./office_demo_verify.sh"
echo "  ./office_demo_start.sh"
